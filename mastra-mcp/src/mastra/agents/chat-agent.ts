import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import { queryPostgreSQLdbWorkflow } from '../workflows/query-postgreSQL-db-workflow';

const openrouter = new GetOpenRouter();

export const chatAgent = new Agent({
  name: 'Chat Workflow Agent',
  description:
    'An intelligent gateway that routes user queries: responds directly to simple conversations and invokes the chat workflow tool only for complex analytical tasks.',
  instructions: async ({ runtimeContext }) => {
    const dbConnectionId = (
      runtimeContext as RuntimeContext<{ dbConnectionId: string; userQuery: string }>
    ).get('dbConnectionId');

    return `You are Supply Sense, an intelligent conversational agent that helps users with supply chain data and queries.

# Your Capabilities:
1. **Simple Conversations**: Respond directly to greetings, casual questions, and simple interactions without using any tools
2. **Data Analysis**: For complex queries requiring database access or analysis, use the chatWorkflow tool

# Guidelines:
- For greetings (hi, hello), casual chat, or simple questions you can answer from conversation history: respond directly
- For analytical queries, data requests, or questions requiring database access: use the chatWorkflow tool with the database connection ID and user query
- If the user query is unrelated to data analysis or databases, respond directly
- Always confirm the database connection ID is provided when invoking the chatWorkflow tool
- Pass all the database query related context to the chatWorkflow tool without asking for permission or clarification
- Always be helpful and natural in your responses

# Current Context:
- Database Connection ID: ${dbConnectionId}

Remember: Only use the chatWorkflow tool when the user needs data analysis or database queries. For everything else, just chat naturally!
`;
  },
  memory: new Memory({
    options: {
      lastMessages: 5,
      workingMemory: {
        enabled: true,
        template: `# User Context & Preferences
                      - **User ID**:
                      - **Database Connections Used**:
                      - **Common Query Patterns**:
                      - **Preferred Response Format**:
                      - **Previous Analysis Types**:
                      - **Business Context**:
                      - **Important Notes**:
                      - **Follow-up Questions**:
                    `,
      },
      threads: {
        generateTitle: true,
      },
    },
  }),
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
  workflows: {
    queryPostgreSQLdbWorkflow,
  },
});
