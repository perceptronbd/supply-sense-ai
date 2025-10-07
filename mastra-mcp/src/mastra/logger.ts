import type { LogLevel } from '@mastra/loggers';
import { PinoLogger } from '@mastra/loggers';

const level = (process.env.MASTRA_LOG_LEVEL as LogLevel | undefined) ?? 'info';

export const mastraLogger = new PinoLogger({
  name: 'Supply Sense MCP',
  level,
});
