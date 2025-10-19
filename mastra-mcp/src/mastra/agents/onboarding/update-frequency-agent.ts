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

export interface BatchDetermineUpdateFrequencyInput {
  tables: Array<{
    tableName: string;
    tableSchema: ITableSchemaInput;
    purpose?: string;
    businessContext?: string;
  }>;
}

export async function determineUpdateFrequency(
  input: DetermineUpdateFrequencyInput | BatchDetermineUpdateFrequencyInput
): Promise<TMetadataUpdateFrequency | TMetadataUpdateFrequency[]> {
  // Handle single table input (backward compatibility)
  if ('tableName' in input) {
    const { tableName, tableSchema, purpose, businessContext } = input;

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

      console.debug(`Received frequency response for ${tableName}: ${frequency}`, {
        usage: response.usage,
      });

      // Validate the response
      return METADATA_UPDATE_FREQUENCIES.includes(frequency) ? frequency : 'daily';
    } catch (error) {
      console.error(`❌ Error determining update frequency for table ${tableName}:`, error);
      return 'daily';
    }
  }

  // Handle batch processing
  const { tables } = input;

  try {
    // Process all tables in parallel
    const results = await Promise.all(
      tables.map((table) =>
        determineUpdateFrequency({
          tableName: table.tableName,
          tableSchema: table.tableSchema,
          purpose: table.purpose,
          businessContext: table.businessContext,
        })
      )
    );

    return results as TMetadataUpdateFrequency[];
  } catch (error) {
    console.error('❌ Error in batch update frequency determination:', error);
    // Return default frequencies for all tables in case of error
    return tables.map(() => 'daily' as TMetadataUpdateFrequency);
  }
}
