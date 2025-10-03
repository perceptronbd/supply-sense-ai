import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { formattingAgent } from './agents/formatting-agent';
import { generatePurposeAgent } from './agents/generate-purpose-agent';
import { queryAnalysisAgent } from './agents/query-analysis-agent';
import { sampleQuestionsAgent } from './agents/sample-questions-agent';
import { sqlGenerationAgent } from './agents/sql-generation-agent';
import { supplyChainAgent } from './agents/supply-chain-agent';
import { updateFrequencyAgent } from './agents/update-frequency-agent';
import { chatWorkflow } from './workflows/chat-workflow';
import { supplyChainWorkflow } from './workflows/supply-chain-workflow';
import { tableMetadataWorkflow } from './workflows/table-metadata-workflow';

export const mastra = new Mastra({
  agents: {
    formattingAgent,
    generatePurposeAgent,
    queryAnalysisAgent,
    sampleQuestionsAgent,
    sqlGenerationAgent,
    supplyChainAgent,
    updateFrequencyAgent,
  },
  workflows: {
    supplyChainWorkflow,
    tableMetadataWorkflow,
    chatWorkflow,
  },
  logger: new PinoLogger({
    name: 'Mastra MCP',
    level: 'info',
  }),
  telemetry: {
    enabled: false,
  },
});
