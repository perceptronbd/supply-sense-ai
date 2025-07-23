import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { AI_MODEL_NAME } from '@supplysense/constant';
import {
  METADATA_AGENT_DESCRIPTION,
  METADATA_AGENT_INSTRUCTIONS,
  METADATA_AGENT_NAME,
} from '../constants/system-instructions/metadata';
import { analyzeTableMetadataTool } from '../tools/metadata-tool';

export const metadataAgent = new Agent({
  name: METADATA_AGENT_NAME,
  description: METADATA_AGENT_DESCRIPTION,
  instructions: METADATA_AGENT_INSTRUCTIONS,
  model: google(AI_MODEL_NAME),
  tools: { analyzeTableMetadataTool },
});
