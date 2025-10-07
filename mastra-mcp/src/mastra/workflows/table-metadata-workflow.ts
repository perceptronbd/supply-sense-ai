
import { createStep, createWorkflow } from '@mastra/core/workflows';
import type { ITableSchemaInput } from '@supplysense/types';
import { generateFriendlyLabel } from '@supplysense/utils';
import { z } from 'zod';

import { generatePurpose } from '../agents/generate-purpose-agent';
import { generateSampleQuestions } from '../agents/sample-questions-agent';
import { determineUpdateFrequency } from '../agents/update-frequency-agent';

// Shared schemas (DRY)
const UpdateFrequencyZ = z.enum(['real-time', 'daily', 'weekly', 'monthly', 'rarely']);

const TableSchemaZ = z
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
  .describe('Table schema information including columns and relationships');

const TableInputZ = z.object({
  tableName: z.string().describe('Name of the table to analyze'),
  tableSchema: TableSchemaZ,
});

const BusinessContextZ = z.string().optional().describe('Business context for the tables');

const ItemBaseZ = z.object({
  tableName: z.string(),
  tableSchema: TableSchemaZ,
  friendlyLabel: z.string(),
});

const ItemsBaseZ = z.array(ItemBaseZ);

// Step A: Normalize input and add friendly label
const prepareTablesStep = createStep({
  id: 'prepare-tables',
  description: 'Normalize input tables and compute friendly labels',
  inputSchema: z.object({
    tables: z.array(TableInputZ).describe('Array of tables to analyze'),
    businessContext: BusinessContextZ,
  }),
  outputSchema: z.object({
    items: ItemsBaseZ,
    businessContext: BusinessContextZ,
  }),
  execute: async (context) => {
    const { tables, businessContext } = context.inputData as {
      tables: Array<{ tableName: string; tableSchema: ITableSchemaInput }>;
      businessContext?: string;
    };

    const items = tables.map(({ tableName, tableSchema }) => ({
      tableName,
      tableSchema,
      friendlyLabel: generateFriendlyLabel(tableName),
    }));

    return { items, businessContext };
  },
});

// Step B: Generate purposes for each table
const generatePurposesStep = createStep({
  id: 'generate-purposes',
  description: 'Generate purposes per table',
  inputSchema: z.object({
    items: ItemsBaseZ,
    businessContext: BusinessContextZ,
  }),
  outputSchema: z.object({
    items: z.array(ItemBaseZ.extend({ purpose: z.string() })),
    businessContext: BusinessContextZ,
  }),
  execute: async (context) => {
    const { items, businessContext } = context.inputData as {
      items: Array<{ tableName: string; tableSchema: ITableSchemaInput; friendlyLabel: string }>;
      businessContext?: string;
    };

    const out = [] as Array<{
      tableName: string;
      tableSchema: ITableSchemaInput;
      friendlyLabel: string;
      purpose: string;
    }>;

    for (const { tableName, tableSchema, friendlyLabel } of items) {
      const purpose = await generatePurpose({
        tableName,
        tableSchema,
        businessContext: businessContext || `Database table analysis for ${tableName}`,
      });
      out.push({ tableName, tableSchema, friendlyLabel, purpose });
    }

    return { items: out, businessContext };
  },
});

// Step C: Determine update frequency per table
const determineUpdateFrequenciesStep = createStep({
  id: 'determine-update-frequencies',
  description: 'Determine update frequency per table',
  inputSchema: z.object({
    items: z.array(ItemBaseZ.extend({ purpose: z.string() })),
    businessContext: BusinessContextZ,
  }),
  outputSchema: z.object({
    items: z.array(ItemBaseZ.extend({ purpose: z.string(), updateFrequency: UpdateFrequencyZ })),
    businessContext: BusinessContextZ,
  }),
  execute: async (context) => {
    const { items, businessContext } = context.inputData as {
      items: Array<{
        tableName: string;
        tableSchema: ITableSchemaInput;
        friendlyLabel: string;
        purpose: string;
      }>;
      businessContext?: string;
    };

    const out = [] as Array<{
      tableName: string;
      tableSchema: ITableSchemaInput;
      friendlyLabel: string;
      purpose: string;
      updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely';
    }>;

    for (const item of items) {
      const updateFrequency = await determineUpdateFrequency({
        tableName: item.tableName,
        tableSchema: item.tableSchema,
        businessContext: businessContext || `Database table analysis for ${item.tableName}`,
      });
      out.push({ ...item, updateFrequency: updateFrequency as any });
    }

    return { items: out, businessContext };
  },
});

// Step D: Generate sample questions per table
const generateQuestionsStep = createStep({
  id: 'generate-questions-batch',
  description: 'Generate sample questions per table',
  inputSchema: z.object({
    items: z.array(ItemBaseZ.extend({ purpose: z.string(), updateFrequency: UpdateFrequencyZ })),
    businessContext: BusinessContextZ,
  }),
  outputSchema: z.array(
    z.object({
      tableName: z.string(),
      friendlyLabel: z.string(),
      purpose: z.string(),
      updateFrequency: UpdateFrequencyZ,
      sampleQuestions: z.array(z.string()),
    })
  ),
  execute: async (context) => {
    const { items, businessContext } = context.inputData as {
      items: Array<{
        tableName: string;
        tableSchema: ITableSchemaInput;
        friendlyLabel: string;
        purpose: string;
        updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely';
      }>;
      businessContext?: string;
    };

    const out = [] as Array<{
      tableName: string;
      friendlyLabel: string;
      purpose: string;
      updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely';
      sampleQuestions: string[];
    }>;

    for (const item of items) {
      const sampleQuestions = await generateSampleQuestions({
        tableName: item.tableName,
        tableSchema: item.tableSchema,
        purpose: item.purpose,
        businessContext: businessContext || `Database table analysis for ${item.tableName}`,
      });
      out.push({
        tableName: item.tableName,
        friendlyLabel: item.friendlyLabel,
        purpose: item.purpose,
        updateFrequency: item.updateFrequency,
        sampleQuestions,
      });
    }

    return out;
  },
})

// Create the table metadata workflow
export const tableMetadataWorkflow = createWorkflow({
  id: 'table-metadata-generation',
  description:
    'Workflow to analyze table metadata for multiple tables, mirroring analyzeTableMetadataTool output',
  inputSchema: prepareTablesStep.inputSchema!,
  outputSchema: generateQuestionsStep.outputSchema!,
})
  .then(prepareTablesStep)
  .then(generatePurposesStep)
  .then(determineUpdateFrequenciesStep)
  .then(generateQuestionsStep)
  .commit();
