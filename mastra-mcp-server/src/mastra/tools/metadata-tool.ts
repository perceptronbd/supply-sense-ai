import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generatePurpose } from '../agents/generate-purpose-agent';
import { generateSampleQuestions } from '../agents/sample-questions-agent';

export const analyzeTableMetadataTool = createTool({
  id: 'analyze-table-metadata',
  description:
    'Analyze database table schema and generate intelligent metadata including friendly labels, purpose, update frequency, data sensitivity, and sample questions',
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
  execute: async ({ context }: any) => {
    const { tableName, tableSchema } = context as {
      tableName: string;
      tableSchema: any;
      businessContext?: string;
    };

    if (!tableName || !tableSchema) {
      throw new Error('Missing required tableName or tableSchema in context');
    }
    try {
      // Generate friendly label by converting table name to human-readable format
      const friendlyLabel = generateFriendlyLabel(tableName);

      // Determine update frequency based on table characteristics
      const updateFrequency = determineUpdateFrequency(tableName);

      // Use workflow to generate purpose and sample questions
      // const { purpose, sampleQuestions } = await tableMetadataWorkflow.execute(
      //   {inputData:context}
      // );

      const purpose = await generatePurpose({
        tableName,
        tableSchema,
        businessContext: context.businessContext || `Database table analysis for ${tableName}`,
      });
      const sampleQuestions = await generateSampleQuestions({
        tableName,
        tableSchema,
        purpose,
        businessContext: context.businessContext || `Database table analysis for ${tableName}`,
      });

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
/**
 * Determine update frequency based on table characteristics
 */
function determineUpdateFrequency(
  tableName: string
): 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely' {
  const name = tableName.toLowerCase();

  const frequencyKeywords: { [key: string]: string[] } = {
    'real-time': ['log', 'audit', 'notification', 'alert', 'session', 'token', 'cache'],
    daily: [
      'request',
      'order',
      'requisition',
      'transaction',
      'payment',
      'receipt',
      'inventory',
      'stock',
      'manufacturing',
      'production',
    ],
    weekly: ['report', 'analytics', 'schedule', 'planning'],
    monthly: ['summary', 'aggregate', 'billing', 'invoice'],
    rarely: [
      'config',
      'setting',
      'template',
      'user',
      'employee',
      'branch',
      'supplier',
      'vendor',
      'customer',
      'item',
      'product',
      'material',
      'formula',
      'calculation',
    ],
  };

  for (const [frequency, keywords] of Object.entries(frequencyKeywords)) {
    if (keywords.some((keyword) => name.includes(keyword))) {
      return frequency as 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely';
    }
  }

  // Default to daily for operational tables
  return 'daily';
}

function generateFriendlyLabel(tableName: string): string {
  return (
    tableName
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Split camelCase words
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Split consecutive capitals (like "XMLHttpRequest" -> "XML Http Request")
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      // Capitalize first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}
