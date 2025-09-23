import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import { GetOpenRouter } from '@supplysense/utils';
import {
  SAMPLE_QUESTIONS_AGENT_DESCRIPTION,
  SAMPLE_QUESTIONS_AGENT_NAME,
  SAMPLE_QUESTIONS_INSTRUCTION,
} from '../constants/system-instructions/sample-questions';

export interface GenerateQuestionsInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose: string;
  businessContext?: string;
}

const openrouter = new GetOpenRouter();

export const sampleQuestionsAgent = new Agent({
  name: SAMPLE_QUESTIONS_AGENT_NAME,
  description: SAMPLE_QUESTIONS_AGENT_DESCRIPTION,
  instructions: SAMPLE_QUESTIONS_INSTRUCTION,
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
    // Add timestamp to ensure unique prompt each time
    const timestamp = new Date().toISOString();

    // Enhanced prompting with variability directive and specific column analysis
    const prompt = `Table: ${tableName}
Purpose: ${purpose}
Columns: ${tableSchema.columns
      .map(
        (c) =>
          `${c.columnName} (${c.dataType}${c.isPrimaryKey ? ', PK' : ''}${
            c.isForeignKey ? ', FK' : ''
          })`
      )
      .join('\n  - ')}
${businessContext ? `Business Context: ${businessContext}` : ''}

CRITICAL INSTRUCTIONS: 
1. Analyze the SPECIFIC column names and data types in this table
2. Generate questions that are UNIQUE to this table's structure and purpose
3. DO NOT use generic questions that could apply to any table
4. Focus on the actual column names (${tableSchema.columns.map((c) => c.columnName).join(', ')}) 
5. Consider the relationships between columns and their business meaning
6. Each question should be tailored to THIS specific table's data and cannot be used for other tables
7. Avoid generic patterns like "What are the trends in [table]" - instead ask about specific columns and their relationships

Generate 6-8 highly specific, contextually relevant questions that users might ask about THIS PARTICULAR table's data.
Questions should reference actual column names and be based on the table's unique structure and purpose.
Current timestamp for uniqueness: ${timestamp}`;

    const response = await sampleQuestionsAgent.generate([
      {
        role: 'user',
        content: prompt,
      },
    ]);
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
