import { Agent } from '@mastra/core/agent';
import { GetOpenRouter } from '@supplysense/utils';
import {
  QUERY_ANALYSIS_AGENT_DESCRIPTION,
  QUERY_ANALYSIS_AGENT_NAME,
  QUERY_ANALYSIS_INSTRUCTION,
} from '../constants/system-instructions/query-analysis';

const openrouter = new GetOpenRouter();

export const queryAnalysisAgent = new Agent({
  name: QUERY_ANALYSIS_AGENT_NAME,
  description: QUERY_ANALYSIS_AGENT_DESCRIPTION,
  instructions: QUERY_ANALYSIS_INSTRUCTION,
  model: openrouter.getModel('z-ai/glm-4.5'),
});
