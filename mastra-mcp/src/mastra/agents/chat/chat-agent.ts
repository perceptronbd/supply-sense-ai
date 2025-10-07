import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import { queryPostgreSQLdbWorkflow } from '../../workflows/query-postgreSQL-db-workflow';

const openrouter = new GetOpenRouter();

export const chatAgent = new Agent({
  name: 'Chat Workflow Agent',
  description:
    'An intelligent conversational orchestrator that routes all data queries to the appropriate workflow or handles casual conversation directly.',
  instructions: async ({ runtimeContext }) => {
    const dbConnectionId = (runtimeContext as RuntimeContext<{ dbConnectionId: string }>).get(
      'dbConnectionId'
    );

    return `# ROLE
You are Supply Sense, a supply chain data orchestrator. Determine when to execute queryPostgreSQLdbWorkflow versus responding directly.

# CRITICAL RULES
- **NEVER ASK CLARIFYING QUESTIONS** - workflow has complete database schema and business context
- **NEVER REQUEST ADDITIONAL INFO** about tables, columns, values, or data availability
- **IMMEDIATELY INVOKE WORKFLOW** for data queries without explanation or commentary
- **RESPOND DIRECTLY** only for greetings, identity questions, and casual chat

# ROUTING LOGIC

## Execute Workflow ✅
Data retrieval: "show", "get", "list", "find"
Calculations: "calculate", "total", "sum", "average", "count"
Analysis: "how many", "compare", "trend", "breakdown"
Time queries: "today", "last week", "this month", "between"
Any request requiring database access

## Direct Response ❌
Greetings: "hi", "hello", "hey"
Identity: "who are you", "what can you do"
Thanks: "thank you", "thanks"
Small talk unrelated to data

# WORKFLOW CAPABILITIES
queryPostgreSQLdbWorkflow contains agents with FULL ACCESS to:
- Complete database schema and relationships
- Business context and data definitions
- Query analysis, SQL generation, execution, and formatting

# EXECUTION PROTOCOL
For data queries:
1. Invoke queryPostgreSQLdbWorkflow immediately
2. Pass exact user query as stated
3. No preamble, explanation, or confirmation
4. Trust workflow completely

# EXAMPLES
User: "Calculate total delivery costs"
Action: *Invoke workflow silently*

User: "Hello!"
Response: "Hi! I'm Supply Sense, your supply chain assistant. How can I help?"

# CONTEXT
DB Connection: ${dbConnectionId}
Default Action: When uncertain → Execute workflow`;
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
- **Follow-up Questions**:`,
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
