import { createTool } from '@mastra/core/tools';
import { ANALYZE_METADATA_TOOL } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import { generateFriendlyLabel } from '@supplysense/utils';
import { z } from 'zod';
import { generatePurpose } from '../agents/generate-purpose-agent';
import { generateSampleQuestions } from '../agents/sample-questions-agent';
import { determineUpdateFrequency as determineUpdateFrequencyAgent } from '../agents/update-frequency-agent';

export const analyzeTableMetadataTool = createTool({
  id: ANALYZE_METADATA_TOOL.NAME,
  description: ANALYZE_METADATA_TOOL.DESCRIPTION,
  inputSchema: z.object({
    tableName: z.string().describe('Name of the table to analyze'),
    tableSchema: z
      .object({
        columns: z.array(
          z.object({
            columnName: z.string(),
            dataType: z.string(),
            isNullable: z.boolean(),
            isPrimaryKey: z.boolean(),
            isForeignKey: z.boolean(),
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
    businessContext: z.string().optional().describe('Additional business context about the table'),
  }),
  outputSchema: z.object({
    tableName: z.string(),
    friendlyLabel: z.string(),
    purpose: z.string(),
    updateFrequency: z.enum(['real-time', 'daily', 'weekly', 'monthly', 'rarely']),
    sampleQuestions: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { tableName, tableSchema } = context as {
      tableName: string;
      tableSchema: unknown;
      businessContext?: string;
    };

    if (!tableName || !tableSchema) {
      throw new Error('Missing required tableName or tableSchema in context');
    }
    try {
      // Generate friendly label by converting table name to human-readable format
      const friendlyLabel = generateFriendlyLabel(tableName);

      // First generate the purpose, then use it for sample questions
      const purpose = await generatePurpose({
        tableName,
        tableSchema: tableSchema as ITableSchemaInput,
        businessContext: context.businessContext || `Database table analysis for ${tableName}`,
      });

      // Execute all AI agents in parallel using Promise.all
      const [updateFrequency, sampleQuestions] = await Promise.all([
        determineUpdateFrequencyAgent({
          tableName,
          tableSchema: tableSchema as ITableSchemaInput,
          businessContext: context.businessContext || `Database table analysis for ${tableName}`,
        }),
        generateSampleQuestions({
          tableName,
          tableSchema: tableSchema as ITableSchemaInput,
          purpose: purpose,
          businessContext: context.businessContext || `Database table analysis for ${tableName}`,
        }),
      ]);
      return {
        tableName,
        friendlyLabel,
        purpose,
        updateFrequency,
        sampleQuestions,
      };
    } catch (error) {
      console.error(`❌ Error analyzing table metadata for ${tableName}:`, error);
      throw new Error('Failed to analyze table metadata');
    }
  },
});
