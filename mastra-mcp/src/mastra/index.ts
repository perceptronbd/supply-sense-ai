import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { chatWorkflowAgent } from './agents/chat-workflow-agent';
import { formattingAgent } from './agents/formatting-agent';
import { generatePurposeAgent } from './agents/generate-purpose-agent';
import { queryAnalysisAgent } from './agents/query-analysis-agent';
import { sampleQuestionsAgent } from './agents/sample-questions-agent';
import { sqlGenerationAgent } from './agents/sql-generation-agent';
import { updateFrequencyAgent } from './agents/update-frequency-agent';
import { mastraLogger } from './logger';
import { chatWorkflow } from './workflows/chat-workflow';
import { tableMetadataWorkflow } from './workflows/table-metadata-workflow';

const storageDir = path.resolve(process.cwd(), 'storage');
mkdirSync(storageDir, { recursive: true });
const memoryDbPath = path.join(storageDir, 'memory.db');

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: `file:${memoryDbPath}`,
  }),
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
  logger: mastraLogger,
  telemetry: {
    enabled: false,
  },
});
