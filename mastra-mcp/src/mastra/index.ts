import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import {
  chatAgent,
  chatTitleAgent,
  formattingAgent,
  postgreSQLGenerationAgent,
  queryAnalysisAgent,
} from './agents/chat';
import {
  columnExampleAgent,
  generatePurposeAgent,
  sampleQuestionsAgent,
  tableDescriptionAgent,
  updateFrequencyAgent,
} from './agents/onboarding';
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
    chatAgent,
    columnExampleAgent,
    tableDescriptionAgent,
    chatTitleAgent,
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
