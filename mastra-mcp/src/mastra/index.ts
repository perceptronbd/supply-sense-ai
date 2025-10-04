import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { chatWorkflowAgent } from './agents/chat-workflow-agent';
import { formattingAgent } from './agents/formatting-agent';
import { generatePurposeAgent } from './agents/generate-purpose-agent';
import { queryAnalysisAgent } from './agents/query-analysis-agent';
import { sampleQuestionsAgent } from './agents/sample-questions-agent';
import { sqlGenerationAgent } from './agents/sql-generation-agent';
import { updateFrequencyAgent } from './agents/update-frequency-agent';
import { chatWorkflow } from './workflows/chat-workflow';
import { tableMetadataWorkflow } from './workflows/table-metadata-workflow';

export const mastra = new Mastra({
  agents: {
    formattingAgent,
    generatePurposeAgent,
    queryAnalysisAgent,
    sampleQuestionsAgent,
    sqlGenerationAgent,
    updateFrequencyAgent,
    chatWorkflowAgent,
  },
  workflows: {
    tableMetadataWorkflow,
    chatWorkflow,
  },
  observability: {
    default: {
      enabled: false,
    },
  },
  logger: new PinoLogger({
    name: 'Supply Sense MCP',
    level: 'info',
  }),
  telemetry: {
    enabled: false,
  },
});
