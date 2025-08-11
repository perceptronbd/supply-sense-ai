import { Agent } from '@mastra/core/agent';
import type { ITableSchemaInput } from '@supplysense/types';
import { GetOpenRouter } from '@supplysense/utils';
import {
  UPDATE_FREQUENCY_AGENT_DESCRIPTION,
  UPDATE_FREQUENCY_AGENT_NAME,
  UPDATE_FREQUENCY_INSTRUCTION,
} from '../constants/system-instructions/update-frequency';

const openrouter = new GetOpenRouter();

export const updateFrequencyAgent = new Agent({
  name: UPDATE_FREQUENCY_AGENT_NAME,
  description: UPDATE_FREQUENCY_AGENT_DESCRIPTION,
  instructions: UPDATE_FREQUENCY_INSTRUCTION,
  model: openrouter.getModel(),
});

// Custom function to use the agent for determining update frequency

export interface DetermineUpdateFrequencyInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose?: string;
  businessContext?: string;
}

const UPDATE_FREQUENCIES = ['real-time', 'daily', 'weekly', 'monthly', 'rarely'] as const;

type UpdateFrequency = (typeof UPDATE_FREQUENCIES)[number];

export async function determineUpdateFrequency({
  tableName,
  tableSchema,
  purpose,
  businessContext,
}: DetermineUpdateFrequencyInput): Promise<UpdateFrequency> {
  if (!tableName || !tableSchema) {
    throw new Error('Missing required tableName or tableSchema');
  }
  const userPrompt = JSON.stringify(
    {
      tableName,
      tableSchema,
      purpose,
      businessContext,
    },
    null,
    2
  );

  try {
    const prompt = `Table: ${tableName}
    Schema: ${JSON.stringify(tableSchema, null, 2)}
    ${purpose ? `Purpose: ${purpose}` : ''}
    ${businessContext ? `Business Context: ${businessContext}` : ''}
    Determine the optimal update frequency for this table.`;

    const response = await updateFrequencyAgent.generate([
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ]);

    const frequency = response.text as UpdateFrequency;

    console.debug(`Received frequency response: ${frequency}`, {
      usage: response.usage,
    });

    console.info(`Determined update frequency for ${tableName}: ${frequency}`);
    // Validate the response
    if (UPDATE_FREQUENCIES.includes(frequency)) {
      return frequency;
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
