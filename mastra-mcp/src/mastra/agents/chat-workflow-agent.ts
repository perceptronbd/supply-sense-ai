import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import { mastra } from '..';
import { chatWorkflow } from '../workflows/chat-workflow';

const openrouter = new GetOpenRouter();

export const chatWorkflowAgent = new Agent({
  name: 'Chat Workflow Agent',
  description:
    'An intelligent gateway that routes user queries: responds directly to simple conversations and invokes the chat workflow tool only for complex analytical tasks.',
  instructions: async ({ runtimeContext }) => {
    const dbConnectionId = (
      runtimeContext as RuntimeContext<{ dbConnectionId: string; userQuery: string }>
    ).get('dbConnectionId');
    const userQuery = (
      runtimeContext as RuntimeContext<{ dbConnectionId: string; userQuery: string }>
    ).get('userQuery');

    const logger = mastra.getLogger();

    logger.info('The request goes through agent!!`');
    logger.info(userQuery);

    return `You are a supply chain AI assistant.

# CRITICAL RULES
1. You may ONLY call the chatWorkflow tool ONCE per request
2. DO NOT make multiple calls or retry the workflow
3. If you already called the workflow, use its result directly
4. For simple conversations, something that does 

# Response Format (Always Follow)
{
  "visualizationType": "text",
  "formattedData": string | null,
  "response": string
}

# Response Rules
- Simple conversations: Respond directly WITHOUT using any tool
- Complex tasks: Use chatWorkflow EXACTLY ONCE, then format the result
- NEVER retry or call the workflow multiple times
- visualizationType is always "text"

# Examples
User: "Hello!"
Response: {
  "visualizationType": "text",
  "formattedData": null,
  "response": "Hello! How can I assist you today?"
}

User: "How many drivers are there?"
→ Call chatWorkflow ONCE with the query
→ Use the returned result to format response
→ DO NOT call again

# Critical
ONE workflow call per request maximum. Never retry or duplicate calls.

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
