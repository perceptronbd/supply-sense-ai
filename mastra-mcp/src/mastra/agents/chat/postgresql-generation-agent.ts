import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  SQL_GENERATION_AGENT_DESCRIPTION,
  SQL_GENERATION_AGENT_NAME,
  SQL_GENERATION_INSTRUCTION,
} from '../../constants/system-instructions/sql-generation';

const openrouter = new GetOpenRouter();

type RuntimeContextData = RuntimeContext<{
  businessContext: string | null;
  parsedSchema: unknown;
  queryAnalysis: string;
}>;

export const postgreSQLGenerationAgent = new Agent({
  name: SQL_GENERATION_AGENT_NAME,
  description: SQL_GENERATION_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as RuntimeContextData;
    const businessContext = context.get('businessContext') as string | null;
    const parsedSchema = context.get('parsedSchema');
    const queryAnalysis = context.get('queryAnalysis') as string;

    return `
    ${SQL_GENERATION_INSTRUCTION}

    ##Current Context
    - Business Context: ${businessContext ?? 'Not provided'}
    - Parsed Schema: ${JSON.stringify(parsedSchema)}
    - Query Analysis: ${queryAnalysis}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
