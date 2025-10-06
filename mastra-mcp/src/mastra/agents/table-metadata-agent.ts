import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import type { ITableSchemaInput } from '@supplysense/types';
import { GetOpenRouter } from '@supplysense/utils';
import {
  TABLE_METADATA_AGENT_DESCRIPTION,
  TABLE_METADATA_AGENT_INSTRUCTIONS,
  TABLE_METADATA_AGENT_NAME,
} from '../constants/system-instructions/metadata';
import { analyzeTableMetadataTool } from '../tools';

const openrouter = new GetOpenRouter();

type TableMetadataAgentInput = RuntimeContext<{
  tables: Array<{ tableName: string; tableSchema: ITableSchemaInput }>;
  businessContext?: string;
}>;

export const tableMetadataAgent = new Agent({
  name: TABLE_METADATA_AGENT_NAME,
  description: TABLE_METADATA_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as TableMetadataAgentInput;
    const tables = context.get('tables');
    const businessContext = context.get('businessContext');

    return `You are an expert data analyst. Your job is to generate metadata for the tables.

        # Current context:
        - Tables: ${tables}
        - Business Context: ${businessContext}
        
        # Instructions:
        ${TABLE_METADATA_AGENT_INSTRUCTIONS}`;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.DEEPSEEK),
  tools: { analyzeTableMetadataTool },
});
