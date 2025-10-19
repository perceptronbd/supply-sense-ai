import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import {
  AI_MODEL_NAMES,
  METADATA_UPDATE_FREQUENCIES,
  type TMetadataUpdateFrequency,
} from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import { GetOpenRouter } from '@supplysense/utils';
import { createRuntimeContext } from '@supplysense/utils/server';
import {
  UPDATE_FREQUENCY_AGENT_DESCRIPTION,
  UPDATE_FREQUENCY_AGENT_NAME,
  UPDATE_FREQUENCY_INSTRUCTION,
} from '../../constants/system-instructions/update-frequency';

const openrouter = new GetOpenRouter();

type RuntimeContextData = RuntimeContext<{
  tableName: string;
  tableSchema: ITableSchemaInput;
  purpose?: string;
  businessContext?: string;
}>;

export const updateFrequencyAgent = new Agent({
  name: UPDATE_FREQUENCY_AGENT_NAME,
  description: UPDATE_FREQUENCY_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const ctx = runtimeContext as RuntimeContextData;
    const tableName = ctx.get('tableName') as string;
    const tableSchema = ctx.get('tableSchema') as ITableSchemaInput;
    const purpose = ctx.get('purpose') as string | undefined;
    const businessContext = ctx.get('businessContext') as string | undefined;

    return `
    ##Instructions
    ${UPDATE_FREQUENCY_INSTRUCTION}

    ##Current Context
    - Table: ${tableName}
    - Schema: ${JSON.stringify(tableSchema)}
    - Purpose: ${purpose ?? 'Not provided'}
    - Business Context: ${businessContext ?? 'Not provided'}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.DEEPSEEK),
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
}: DetermineUpdateFrequencyInput): Promise<TMetadataUpdateFrequency> {
  if (!tableName || !tableSchema) {
    throw new Error('Missing required tableName or tableSchema');
  }

  try {
    const runtimeContext = createRuntimeContext({
      tableName,
      tableSchema,
      purpose,
      businessContext,
    });

    const response = await updateFrequencyAgent.generate(
      [
        {
          role: 'user',
          content: `Determine the optimal update frequency for table ${tableName}`,
        },
      ],
      { runtimeContext }
    );

    const frequency = response.text as TMetadataUpdateFrequency;

    console.debug(`Received frequency response: ${frequency}`, {
      usage: response.usage,
    });

    // Validate the response
    if (METADATA_UPDATE_FREQUENCIES.includes(frequency)) {
      return frequency;
    }
    return 'daily';
  } catch (error) {
    console.error(`❌ Error determining update frequency for table ${tableName}:`, error);
    // Fallback to daily on error
    return 'daily';
  }
}
