import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  FORMATTING_AGENT_DESCRIPTION,
  FORMATTING_AGENT_NAME,
  FORMATTING_INSTRUCTION,
} from '../../constants/system-instructions/result-formatting';

const openrouter = new GetOpenRouter();

type RuntimeContextData = RuntimeContext<{
  queryResults: Record<string, unknown>[];
  sqlQuery: string;
}>;

export const formattingAgent = new Agent({
  name: FORMATTING_AGENT_NAME,
  description: FORMATTING_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as RuntimeContextData;
    const queryResults = context.get('queryResults') as Record<string, unknown>[];
    const sqlQuery = context.get('sqlQuery') as string;

    return `
    ##Instructions
    ${FORMATTING_INSTRUCTION}
    
    ##Current Context
    - Query Results: ${JSON.stringify(queryResults)}
    - SQL Query: ${sqlQuery}
    
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
