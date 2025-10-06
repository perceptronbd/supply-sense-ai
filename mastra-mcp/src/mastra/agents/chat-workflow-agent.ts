import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import { mastra } from '..';
import { chatWorkflow } from '../workflows/chat-workflow';

const openrouter = new GetOpenRouter();

type ChatWorkflowAgentInput = RuntimeContext<{ dbConnectionId: string; userQuery: string }>;

export const chatWorkflowAgent = new Agent({
  name: 'Chat Workflow Agent',
  description:
    'An intelligent gateway that routes user queries: responds directly to simple conversations and invokes the chat workflow tool only for complex analytical tasks.',
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as ChatWorkflowAgentInput;
    const dbConnectionId = context.get('dbConnectionId');
    const userQuery = context.get('userQuery');

    const logger = mastra.getLogger();

    logger.info('The request goes through agent!!`');
    logger.info(userQuery);

    return `You are Supply Sense AI agent. Your job is to pass the user query and database connection ID to the chatWorkflow and return the result.

    # Current context:
    - Database Connection ID: ${dbConnectionId || 'cf91e1a7-9a95-41ff-8764-df894e54b554'}
    - User Query: ${userQuery}
`;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
  workflows: {
    chatWorkflow,
  },
});
