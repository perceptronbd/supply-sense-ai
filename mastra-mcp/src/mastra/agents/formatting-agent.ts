import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';

const openrouter = new GetOpenRouter();

export const formattingAgent = new Agent({
  name: 'Result Formatting Agent',
  description:
    'An intelligent agent that analyzes query results and determines the optimal visualization format for frontend display. It handles bar, area, line, and radar charts, as well as tables and text responses.',
  instructions: `You are a Result Formatting Agent and data visualization expert. Transform database query results into optimal presentation formats for frontend display. 

    Analyze data structure and context to select the best visualization type (bar, line, pie, table, or text), then format the data appropriately for Chart.js compatibility or table display.
  
    Focus on clarity, accuracy, and choosing formats that best communicate the data's meaning to users.`,
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
