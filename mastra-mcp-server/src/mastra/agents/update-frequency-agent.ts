import { Agent } from '@mastra/core/agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAME } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import {
  UPDATE_FREQUENCY_AGENT_DESCRIPTION,
  UPDATE_FREQUENCY_AGENT_NAME,
  UPDATE_FREQUENCY_INSTRUCTION,
} from '../constants/system-instructions/update-frequency';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const updateFrequencyAgent = new Agent({
  name: UPDATE_FREQUENCY_AGENT_NAME,
  description: UPDATE_FREQUENCY_AGENT_DESCRIPTION,
  instructions: UPDATE_FREQUENCY_INSTRUCTION,
  model: openrouter(AI_MODEL_NAME),
});

// Custom function to use the agent for determining update frequency

export interface DetermineUpdateFrequencyInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose?: string;
  businessContext?: string;
}

export async function determineUpdateFrequency({
  tableName,
  tableSchema,
  purpose,
  businessContext,
}: DetermineUpdateFrequencyInput): Promise<
  'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely'
> {
  if (!tableName || !tableSchema) {
    throw new Error('Missing required tableName or tableSchema');
  }

  try {
    const prompt = `Table: ${tableName}
Schema: ${JSON.stringify(tableSchema, null, 2)}
${purpose ? `Purpose: ${purpose}` : ''}
${businessContext ? `Business Context: ${businessContext}` : ''}

Determine the optimal update frequency for this table.`;

    const response = await updateFrequencyAgent.generate([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const frequency = response.text.trim().toLowerCase();

    // Validate the response
    const validFrequencies = ['real-time', 'daily', 'weekly', 'monthly', 'rarely'];
    if (validFrequencies.includes(frequency)) {
      return frequency as 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely';
    }

    // Fallback to daily if response is invalid
    console.warn(`Invalid frequency response: ${frequency}. Defaulting to 'daily'`);
    return 'daily';
  } catch (error) {
    console.error(`❌ Error determining update frequency for table ${tableName}:`, error);
    // Fallback to daily on error
    return 'daily';
  }
}
