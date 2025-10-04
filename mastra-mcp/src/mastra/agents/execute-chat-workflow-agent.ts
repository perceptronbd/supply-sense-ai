import { createTool } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import z from 'zod';
import { chatWorkflow } from '../workflows/chat-workflow';

const openrouter = new GetOpenRouter();

const chatWorkflowTool = createTool({
  name: 'executeChatWorkflow',
  description:
    'Execute a structured chat workflow for complex, analytical, or multi-step supply chain tasks. Only invoke for non-conversational, data-driven queries requiring processing. Never use for greetings, thanks, farewells, or simple questions.',
  //@ts-ignore
  inputSchema: z.object({
    userQuery: z
      .string()
      .describe(
        'The user’s original query that requires analysis, data processing, or workflow execution'
      ),
    dbConnectionId: z
      .string()
      .optional()
      .describe('Database connection ID for accessing required data'),
  }),
  //@ts-ignore
  outputSchema: z.object({
    result: z.any(),
  }),
  //@ts-ignore
  execute: async ({ userQuery, dbConnectionId }) => {
    const run = await chatWorkflow.createRunAsync();
    const result = await run.start({
      inputData: { userQuery, dbConnectionId },
    });
    return { result };
  },
});

export const chatWorkflowAgent = new Agent({
  name: 'Chat Workflow Agent',
  description:
    'An intelligent gateway that routes user queries: responds directly to simple conversations and invokes the chat workflow tool only for complex analytical tasks.',
  instructions: async ({ runtimeContext }) => {
    const dbConnectionId = runtimeContext.get('dbConnectionId');
    const userQuery = runtimeContext.get('userQuery');

    return `You are a supply chain AI assistant.
    
Current context:
- Database Connection ID: ${dbConnectionId}
- User Query: ${userQuery || 'Not provided'}

# Role and Purpose
You are a smart routing agent. Your job is to:
1. Respond directly to simple conversational inputs
2. Use the executeChatWorkflow tool ONLY for complex, analytical, or data-processing tasks

# Tool Usage Policy
- NEVER call executeChatWorkflow for:
  • Greetings: "hi", "hello", "hey", "good morning"
  • Casual chat: "how are you?", "what's up?"
  • Simple questions: "who are you?", "what can you do?"
  • Polite expressions: "thank you", "thanks"
  • Farewells: "bye", "goodbye"
  • Basic acknowledgments: "ok", "got it"
- ONLY call executeChatWorkflow for:
  • Data analysis requests
  • Multi-step processing tasks
  • Information retrieval and transformation
  • Complex supply chain queries

# Response Format (Always Follow)
{
  "visualizationType": "text",
  "formattedData": string | null,
  "summary": string
}

# Response Rules
- For simple conversations: respond directly, do not use any tool
- For complex tasks: use executeChatWorkflow, then format the result
- visualizationType is always "text"
- formattedData contains the full result or null for simple responses
- summary is a concise 1-2 sentence overview

# Examples
User: "Hello!"
Response: {
  "visualizationType": "text",
  "formattedData": null,
  "summary": "Hello! How can I assist you today?"
}

User: "Analyze Q3 sales data"
→ Use executeChatWorkflow with the query
→ Format the result in the required structure

# Critical
Never deviate from this behavior. Simple input = direct response. Complex task = use tool. Always use the exact response format.`;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
  tools: {
    executeChatWorkflow: chatWorkflowTool,
  },
});
