const openrouter = new GetOpenRouter();

import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  SQL_GENERATION_AGENT_DESCRIPTION,
  SQL_GENERATION_AGENT_NAME,
  SQL_GENERATION_INSTRUCTION,
} from '../constants/system-instructions/sql-generation';

export const sqlGenerationAgent = new Agent({
  name: SQL_GENERATION_AGENT_NAME,
  description: SQL_GENERATION_AGENT_DESCRIPTION,
  instructions: SQL_GENERATION_INSTRUCTION,
  model: openrouter.getModel(AI_MODEL_NAMES.Z_AI),
});
