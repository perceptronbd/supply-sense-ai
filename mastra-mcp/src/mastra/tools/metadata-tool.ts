import { createTool } from '@mastra/core/tools';

import type { ITableSchemaInput } from '@supplysense/types';
import { generateFriendlyLabel } from '@supplysense/utils';
import { z } from 'zod';
import { generatePurpose } from '../agents/generate-purpose-agent';
import { generateSampleQuestions } from '../agents/sample-questions-agent';
import { determineUpdateFrequency as determineUpdateFrequencyAgent } from '../agents/update-frequency-agent';
import { ANALYZE_METADATA_TOOL } from '../constants/system-instructions/metadata';

// Helper function to extract tables data from context
function extractTablesFromContext(context: unknown): {
  tables: Array<{
    tableName: string;
    tableSchema: ITableSchemaInput;
  }>;
} {
  // Handle direct context
  if (
    context &&
    typeof context === 'object' &&
    'tables' in context &&
    Array.isArray(context.tables)
  ) {
    return {
      tables: context.tables as Array<{
        tableName: string;
        tableSchema: ITableSchemaInput;
      }>,
    };
  }

  // Try to extract from agent message content
  const content =
    (context && typeof context === 'object' && 'content' in context ? context.content : null) ||
    (context && typeof context === 'object' && 'message' in context ? context.message : null) ||
    JSON.stringify(context);

  if (typeof content === 'string') {
    // Look for JSON data in the content
    const jsonMatch = /\{[\s\S]*"tables"[\s\S]*\}/.exec(content);
    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        return {
          tables: parsedData.tables || [],
        };
      } catch {
        // JSON parsing failed, fall through to error
      }
    }
  }

  throw new Error('Invalid context: Unable to extract tables data from input');
}
const inputSchema = z.object({
  tables: z
    .array(
      z.object({
        tableName: z.string().describe('Name of the table to analyze'),
        tableSchema: z
          .object({
            columns: z.array(
              z.object({
                columnName: z.string(),
                dataType: z.string(),
                isNullable: z.boolean().optional().nullable(),
                isPrimaryKey: z.boolean().optional().nullable(),
                isForeignKey: z.boolean().optional().nullable(),
                referencedTable: z.string().optional(),
                referencedColumn: z.string().optional(),
                columnComment: z.string().optional(),
              })
            ),
            relationships: z
              .array(
                z.object({
                  type: z.enum(['one-to-many', 'many-to-one', 'many-to-many']),
                  targetTable: z.string(),
                  foreignKey: z.string(),
                  description: z.string(),
                })
              )
              .optional(),
          })
          .describe('Table schema information including columns and relationships'),
      })
    )
    .describe('Array of tables to analyze'),
  businessContext: z.string().optional().describe('Business context for the tables'),
});

export const analyzeTableMetadataTool = createTool({
  id: ANALYZE_METADATA_TOOL.NAME,
  description: ANALYZE_METADATA_TOOL.DESCRIPTION,
  inputSchema: inputSchema,
  outputSchema: z.array(
    z.object({
      tableName: z.string(),
      friendlyLabel: z.string(),
      purpose: z.string(),
      updateFrequency: z.enum(['real-time', 'daily', 'weekly', 'monthly', 'rarely']),
      sampleQuestions: z.array(z.string()),
    })
  ),
  execute: async ({ context }) => {
    const { tables } = extractTablesFromContext(context);

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      throw new Error('Missing required tables array in context');
    }

    try {
      // Process each table with unique metadata generation
      const results = [];

      for (const { tableName, tableSchema } of tables) {
        if (!tableName || !tableSchema) {
          throw new Error(`Missing required tableName or tableSchema for table: ${tableName}`);
        }

        // Generate friendly label by converting table name to human-readable format
        const friendlyLabel = generateFriendlyLabel(tableName);

        // Generate unique purpose based on specific table structure
        const purpose = await generatePurpose({
          tableName,
          tableSchema,
          businessContext: context.businessContext || `Database table analysis for ${tableName}`,
        });

        // Execute remaining AI agents in parallel
        const [updateFrequency, sampleQuestions] = await Promise.all([
          determineUpdateFrequencyAgent({
            tableName,
            tableSchema,
            businessContext: context.businessContext || `Database table analysis for ${tableName}`,
          }),
          generateSampleQuestions({
            tableName,
            tableSchema,
            purpose: purpose,
            businessContext: context.businessContext || `Database table analysis for ${tableName}`,
          }),
        ]);

        results.push({
          tableName,
          friendlyLabel,
          purpose,
          updateFrequency,
          sampleQuestions,
        });
      }

      return results;
    } catch (error) {
      console.error('❌ Error analyzing table metadata for tables:', error);
      throw new Error('Failed to analyze table metadata');
    }
  },
});
