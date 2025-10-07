import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  QUERY_ANALYSIS_AGENT_DESCRIPTION,
  QUERY_ANALYSIS_AGENT_NAME,
  QUERY_ANALYSIS_INSTRUCTION,
} from '../../constants/system-instructions/query-analysis';

const openrouter = new GetOpenRouter();

type RuntimeContextData = RuntimeContext<{
  businessContext: string | null;
  schemaCache: unknown;
}>;

export const queryAnalysisAgent = new Agent({
  name: QUERY_ANALYSIS_AGENT_NAME,
  description: QUERY_ANALYSIS_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as RuntimeContextData;
    const businessContext = context.get('businessContext') as string | null;
    const schemaCache = context.get('schemaCache');

    return `
    ${QUERY_ANALYSIS_INSTRUCTION}

    ##Current Context
    - Business Context: ${businessContext ?? 'Not provided'}
    - Schema Cache: ${JSON.stringify(schemaCache)}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
