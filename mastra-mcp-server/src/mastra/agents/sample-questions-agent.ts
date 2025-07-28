import { Agent } from '@mastra/core/agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAME } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import {
  SAMPLE_QUESTIONS_AGENT_DESCRIPTION,
  SAMPLE_QUESTIONS_AGENT_NAME,
  SAMPLE_QUESTIONS_INSTRUCTION,
} from '../constants/system-instructions/sample-questions';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface GenerateQuestionsInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose: string;
  businessContext?: string;
}

export const sampleQuestionsAgent = new Agent({
  name: SAMPLE_QUESTIONS_AGENT_NAME,
  description: SAMPLE_QUESTIONS_AGENT_DESCRIPTION,
  instructions: SAMPLE_QUESTIONS_INSTRUCTION,
  model: openrouter(AI_MODEL_NAME),
});

// Custom function to use the agent
export async function generateSampleQuestions({
  tableName,
  tableSchema,
  purpose,
  businessContext,
}: GenerateQuestionsInput) {
  if (!tableName || !tableSchema) {
    throw new Error('Missing required tableName or tableSchema');
  }
  try {
    // Add timestamp to ensure unique prompt each time
    const timestamp = new Date().toISOString();

    // Enhanced prompting with variability directive
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

Generate 6-8 diverse and creative random sample questions that users might ask about this data.
Important: Make sure to generate different questions than previously, focusing on various aspects of the data.
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
 * Uses table metadata to create relevant and varied questions
 */
function generateFallbackQuestions(tableName: string, tableSchema: ITableSchemaInput): string[] {
  // Base question templates that can be customized
  const questionTemplates = [
    'What are the main insights we can get from the {table} table?',
    'How is the data in {table} related to our business goals?',
    'What trends can we identify in the {table} data?',
    'How frequently is the {table} data updated?',
    'Which {column} values are most common in the {table} table?',
    'What is the relationship between {table} and other tables in our database?',
    'How has the {table} data changed over time?',
    'What are the key performance indicators we can derive from {table}?',
    'How complete is our {table} data?',
    'Which users interact most with the {table} data?',
    'What business decisions are influenced by the {table} data?',
    'Are there any anomalies in the {table} data we should investigate?',
  ];

  // Shuffle the question templates to add randomness
  const shuffled = [...questionTemplates].sort(() => 0.5 - Math.random());

  // Get some column names to use in the questions
  const columns = tableSchema.columns.map((c) => c.columnName);
  const randomColumn = columns[Math.floor(Math.random() * columns.length)];

  // Generate 6-8 questions with randomized content
  const numQuestions = Math.floor(Math.random() * 3) + 6; // 6-8 questions
  const result = shuffled.slice(0, numQuestions).map((template) => {
    return template.replace(/{table}/g, tableName).replace(/{column}/g, randomColumn || 'data');
  });

  return result;
}
