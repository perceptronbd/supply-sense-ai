import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

export const mastra = new Mastra({
  logger: new PinoLogger({
    name: 'Mastra MCP',
    level: 'info',
  }),
  telemetry: {
    enabled: false,
  },
});
