import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import { GetOpenRouter } from '@supplysense/utils';
import { createRuntimeContext } from '@supplysense/utils/server';
import { mastra } from '../..';
import {
  SAMPLE_QUESTIONS_AGENT_DESCRIPTION,
  SAMPLE_QUESTIONS_AGENT_NAME,
  SAMPLE_QUESTIONS_INSTRUCTION,
} from '../../constants/system-instructions/sample-questions';

export interface GenerateQuestionsInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose: string;
  businessContext?: string;
}

const openrouter = new GetOpenRouter();

type RuntimeContextData = RuntimeContext<{
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose: string;
  businessContext?: string;
  timestamp: string;
}>;

export const sampleQuestionsAgent = new Agent({
  name: SAMPLE_QUESTIONS_AGENT_NAME,
  description: SAMPLE_QUESTIONS_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const ctx = runtimeContext as RuntimeContextData;
    const tableName = ctx.get('tableName') as string;
    const tableSchema = ctx.get('tableSchema') as ITableSchemaInput;
    const purpose = ctx.get('purpose') as string;
    const businessContext = ctx.get('businessContext') as string | undefined;
    const timestamp = ctx.get('timestamp') as string;

    return `
    ##Instructions
    ${SAMPLE_QUESTIONS_INSTRUCTION}

    ##Current Context
    - Table: ${tableName}
    - Purpose: ${purpose}
    - Columns: ${JSON.stringify(tableSchema?.columns ?? [])}
    - Business Context: ${businessContext ?? 'Not provided'}
    - Timestamp: ${timestamp}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.DEEPSEEK),
});

// Custom function to use the agent
export async function generateSampleQuestions({
  tableName,
  tableSchema,
  purpose,
  businessContext,
}: GenerateQuestionsInput) {
  if (!tableName) {
    throw new Error('Missing required parameter: tableName');
  }
  if (!tableSchema) {
    throw new Error('Missing required parameter: tableSchema');
  }
  if (!tableSchema.columns || !Array.isArray(tableSchema.columns)) {
    throw new Error('Invalid tableSchema: columns array is required');
  }
  try {
    const timestamp = new Date().toISOString();
    const agent = mastra.getAgent('sampleQuestionsAgent');
    const runtimeContext = createRuntimeContext({
      tableName,
      tableSchema,
      purpose,
      businessContext,
      timestamp,
    });

    const response = await agent.generate(
      [
        {
          role: 'user',
          content: `Generate 6-8 highly specific sample questions for table ${tableName}`,
        },
      ],
      { runtimeContext }
    );
    const questions = response.text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && (line.endsWith('?') || /^\d+[.)]/.test(line)))
      .map((q: string) => q.replace(/^\d+[.)]\s*/, '').trim())
      .filter(Boolean);

    // If we got fewer than 3 questions, generate fallback questions with randomization
    if (questions.length < 3) {
      const fallbackQuestions = generateFallbackQuestions(tableName, tableSchema);
      return [...questions, ...fallbackQuestions].slice(0, 8);
    }

    return questions;
  } catch (error) {
    console.error(`❌ Error generating sample questions for table ${tableName}:`, error);
    // On error, generate fallback questions instead of throwing
    return generateFallbackQuestions(tableName, tableSchema);
  }
}

/**
 * Generates diverse fallback questions when the AI response is insufficient
 * Uses table metadata to create relevant and varied questions specific to the table structure
 */
function generateFallbackQuestions(tableName: string, tableSchema: ITableSchemaInput): string[] {
  const columns = tableSchema.columns;
  const questions: string[] = [];

  // Get specific column types for targeted questions
  const dateColumns = columns.filter(
    (c) => c.dataType.toLowerCase().includes('date') || c.dataType.toLowerCase().includes('time')
  );
  const numericColumns = columns.filter(
    (c) =>
      c.dataType.toLowerCase().includes('int') ||
      c.dataType.toLowerCase().includes('decimal') ||
      c.dataType.toLowerCase().includes('float') ||
      c.dataType.toLowerCase().includes('numeric')
  );
  const textColumns = columns.filter(
    (c) =>
      c.dataType.toLowerCase().includes('varchar') ||
      c.dataType.toLowerCase().includes('text') ||
      c.dataType.toLowerCase().includes('char')
  );
  const primaryKeyColumns = columns.filter((c) => c.isPrimaryKey);
  const foreignKeyColumns = columns.filter((c) => c.isForeignKey);

  // Generate specific questions based on actual column structure
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0].columnName;
    questions.push(`What is the distribution of records by ${dateCol} over time?`);
    questions.push(`How many records were created in the last month based on ${dateCol}?`);
  }

  if (numericColumns.length > 0) {
    const numCol = numericColumns[0].columnName;
    questions.push(`What is the average ${numCol} in the ${tableName} table?`);
    questions.push(`What are the highest and lowest values for ${numCol}?`);
  }

  if (textColumns.length > 0) {
    const textCol = textColumns[0].columnName;
    questions.push(`What are the most common values for ${textCol}?`);
    questions.push(`How many unique ${textCol} values exist in ${tableName}?`);
  }

  if (foreignKeyColumns.length > 0) {
    const fkCol = foreignKeyColumns[0].columnName;
    const refTable = foreignKeyColumns[0].referencedTable || 'related table';
    questions.push(`How is ${tableName} connected to ${refTable} through ${fkCol}?`);
    questions.push(`What is the relationship pattern between ${tableName} and ${refTable}?`);
  }

  if (primaryKeyColumns.length > 0) {
    const pkCol = primaryKeyColumns[0].columnName;
    questions.push(`How are records identified in ${tableName} using ${pkCol}?`);
  }

  // Add some general but table-specific questions
  questions.push(`What business processes are supported by the ${tableName} table?`);
  questions.push(`How does the structure of ${tableName} reflect our business requirements?`);

  // If we have fewer than 6 questions, add some column-specific ones
  while (questions.length < 6 && columns.length > 0) {
    const randomColumn = columns[Math.floor(Math.random() * columns.length)];
    const question = `What insights can we derive from the ${randomColumn.columnName} field in ${tableName}?`;
    if (!questions.includes(question)) {
      questions.push(question);
    }
  }

  // Shuffle the questions to add variety
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 8);
}
