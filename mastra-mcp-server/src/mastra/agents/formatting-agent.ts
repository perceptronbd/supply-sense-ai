import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import {
  FORMATTING_AGENT_DESCRIPTION,
  FORMATTING_AGENT_NAME,
  FORMATTING_INSTRUCTION,
} from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';

const openrouter = new GetOpenRouter();

export const formattingAgent = new Agent({
  name: FORMATTING_AGENT_NAME,
  description: FORMATTING_AGENT_DESCRIPTION,
  instructions: FORMATTING_INSTRUCTION,
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
