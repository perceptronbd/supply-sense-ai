import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { generatePurpose } from '../agents/generate-purpose-agent';
import { generateSampleQuestions } from '../agents/sample-questions-agent';

// Step 1: Generate table purpose
const generatePurposeStep = createStep({
  id: 'generate-purpose',
  description: 'Generate a business purpose for the given table',
  inputSchema: z.object({
    tableName: z.string().describe('Name of the database table'),
    tableSchema: z.any().describe('Table schema definition'),
    businessContext: z
      .string()
      .optional()
      .describe('Optional business context or domain information'),
  }),
  outputSchema: z.object({
    tableName: z.string(),
    tableSchema: z.any(),
    purpose: z.string(),
    businessContext: z.string().optional(),
  }),
  execute: async (context) => {
    console.log('🚀 ~ execute: ~ context:', context.inputData);
    const { tableName, tableSchema, businessContext } = context.inputData;
    console.log(`🔍 Generating purpose for table: ${tableName}`);
    try {
      const purpose = await generatePurpose({
        tableName,
        tableSchema,
        businessContext: businessContext || `Database table analysis for ${tableName}`,
      });
      console.log(`✅ Generated purpose: ${purpose.substring(0, 100)}...`);
      return {
        tableName,
        tableSchema,
        purpose,
        businessContext,
      };
    } catch (error) {
      console.error(`❌ Error generating purpose for table ${tableName}:`, error);
      throw new Error('Failed to generate table purpose');
    }
  },
});

// Step 2: Generate sample questions based on the purpose
const generateSampleQuestionsStep = createStep({
  id: 'generate-questions',
  description: 'Generate sample questions based on the table purpose',
  inputSchema: z.object({
    tableName: z.string(),
    tableSchema: z.any(),
    purpose: z.string(),
    businessContext: z.string().optional(),
  }),
  outputSchema: z.object({
    tableName: z.string(),
    purpose: z.string(),
    sampleQuestions: z.array(z.string()),
  }),
  execute: async (context) => {
    console.log('🚀 ~ execute: ~ context:', context.inputData);
    const { tableName, tableSchema, purpose, businessContext } = context.inputData;
    console.log(`❓ Generating sample questions for table: ${tableName}`);
    try {
      const questions = await generateSampleQuestions({
        tableName,
        tableSchema,
        purpose,
        businessContext: businessContext || `Database table analysis for ${tableName}`,
      });
      console.log(`✅ Generated ${questions.length} sample questions`);
      questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
      return {
        tableName,
        purpose,
        sampleQuestions: questions,
      };
    } catch (error) {
      console.error(`❌ Error generating sample questions for table ${tableName}:`, error);
      throw new Error('Failed to generate sample questions');
    }
  },
});

// Create the table metadata workflow
export const tableMetadataWorkflow = createWorkflow({
  id: 'table-metadata-generation',
  description: 'Generate table metadata including purpose and sample questions',
  inputSchema: z.object({
    tableName: z.string().describe('Name of the database table'),
    tableSchema: z.any().describe('Table schema definition'),
    businessContext: z
      .string()
      .optional()
      .describe('Optional business context or domain information'),
  }),
  outputSchema: z.object({
    tableName: z.string(),
    purpose: z.string(),
    sampleQuestions: z.array(z.string()),
  }),
})
  .then(generatePurposeStep)
  .then(generateSampleQuestionsStep)
  .commit();
