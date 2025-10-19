import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import { GetOpenRouter } from '@supplysense/utils';
import { createRuntimeContext } from '@supplysense/utils/server';
import {
  PURPOSE_GENERATION_AGENT_DESCRIPTION,
  PURPOSE_GENERATION_AGENT_NAME,
  PURPOSE_GENERATION_INSTRUCTION,
} from '../../constants/system-instructions/purpose-generation';

const openrouter = new GetOpenRouter();

type RuntimeContextData = RuntimeContext<{
  tableName: string;
  tableSchema: ITableSchemaInput;
  businessContext?: string;
}>;

export const generatePurposeAgent = new Agent({
  name: PURPOSE_GENERATION_AGENT_NAME,
  description: PURPOSE_GENERATION_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as RuntimeContextData;
    const tableName = context.get('tableName') as string;
    const tableSchema = context.get('tableSchema') as ITableSchemaInput;
    const businessContext = context.get('businessContext') as string | undefined;

    return `
    ##Instructions
    ${PURPOSE_GENERATION_INSTRUCTION}

    ##Current Context
    - Table: ${tableName}
    - Schema: ${JSON.stringify(tableSchema)}
    - Business Context: ${businessContext ?? 'Not provided'}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.DEEPSEEK),
});

// Custom function to use the agent for generating table purpose

export interface GeneratePurposeInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  businessContext?: string;
}

export interface BatchGeneratePurposeInput {
  tables: Array<{
    tableName: string;
    tableSchema: ITableSchemaInput;
    businessContext?: string;
  }>;
}

export async function generatePurpose(
  input: GeneratePurposeInput | BatchGeneratePurposeInput
): Promise<string | string[]> {
  // Handle single table input (backward compatibility)
  if ('tableName' in input) {
    const { tableName, tableSchema, businessContext } = input;

    if (!tableName || !tableSchema) {
      throw new Error('Missing required tableName or tableSchema');
    }

    try {
      const runtimeContext = createRuntimeContext({
        tableName,
        tableSchema,
        businessContext,
      });

      const response = await generatePurposeAgent.generate(
        [
          {
            role: 'user',
            content: `Generate a concise business purpose for table ${tableName}`,
          },
        ],
        { runtimeContext }
      );

      let purpose = response.text.trim();
      // Remove leading and trailing '**' if present
      purpose = purpose.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
      return purpose;
    } catch (error) {
      console.error(`❌ Error generating purpose for table ${tableName}:`, error);

      // Check for specific OpenRouter payment error
      if (
        error.message?.includes('Payment Required') ||
        error.message?.includes('Insufficient credits')
      ) {
        console.warn(
          `💳 OpenRouter payment required. Using fallback purpose for table ${tableName}`
        );
      }

      // Return a fallback purpose instead of throwing
      const fallbackPurpose = `This table stores ${tableName.toLowerCase()} related data for business operations and analysis.`;
      console.warn(`Using fallback purpose: ${fallbackPurpose}`);
      return fallbackPurpose;
    }
  }

  // Handle batch processing
  const { tables } = input;

  try {
    // Process all tables in parallel
    const results = await Promise.all(
      tables.map((table) =>
        generatePurpose({
          tableName: table.tableName,
          tableSchema: table.tableSchema,
          businessContext: table.businessContext,
        })
      )
    );

    return results as string[];
  } catch (error) {
    console.error('❌ Error in batch purpose generation:', error);
    // Return fallback purposes for all tables in case of error
    return tables.map(
      (table) =>
        `This table stores ${table.tableName.toLowerCase()} related data for business operations and analysis.`
    );
  }
}
