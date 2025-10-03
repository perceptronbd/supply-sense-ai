import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { formattingAgent } from './agents/formatting-agent';

export const mastra = new Mastra({
  agents: { formattingAgent },
  logger: new PinoLogger({
    name: 'Mastra MCP',
    level: 'info',
  }),
  telemetry: {
    enabled: false,
  },
});
