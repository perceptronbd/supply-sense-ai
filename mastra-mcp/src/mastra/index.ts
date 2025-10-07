import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { chatAgent } from './agents/chat/chat-agent';
import { formattingAgent } from './agents/chat/formatting-agent';
import { postgreSQLGenerationAgent } from './agents/chat/postgresql-generation-agent';
import { queryAnalysisAgent } from './agents/chat/query-analysis-agent';
import { generatePurposeAgent } from './agents/onboarding/generate-purpose-agent';
import { sampleQuestionsAgent } from './agents/onboarding/sample-questions-agent';
import { tableMetadataAgent } from './agents/onboarding/table-metadata-agent';
import { updateFrequencyAgent } from './agents/onboarding/update-frequency-agent';
import { mastraLogger } from './logger';
import { queryPostgreSQLdbWorkflow } from './workflows/query-postgreSQL-db-workflow';
import { tableMetadataWorkflow } from './workflows/table-metadata-workflow';

const storageDir = path.resolve(process.cwd(), 'storage');
mkdirSync(storageDir, { recursive: true });
const memoryDbPath = path.join(storageDir, 'memory.db');

export const mastra = new Mastra({
  bundler: {
    externals: ['ai', '@mastra/core', 'openai', 'zod'],
  },
  storage: new LibSQLStore({
    url: `file:${memoryDbPath}`,
  }),
  agents: {
    formattingAgent,
    generatePurposeAgent,
    queryAnalysisAgent,
    sampleQuestionsAgent,
    postgreSQLGenerationAgent,
    updateFrequencyAgent,
    tableMetadataAgent,
    chatAgent,
  },
  workflows: {
    tableMetadataWorkflow,
    queryPostgreSQLdbWorkflow,
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
