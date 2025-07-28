export interface AppConfig {
  // Server settings
  port: number;
  nodeEnv: string;
  apiPrefix: string;

  // Database settings
  databaseUrl: string;

  // JWT settings
  jwtSecret: string;

  // Gemini AI settings
  geminiApiKey: string;
  geminiModel: string;

  // MCP Server settings
  mcpServerUrl: string;
  mcpServerEndpoint: string;
  mcpServerTimeout: number;
}

export const appConfig: AppConfig = {
  // Server settings
  port: Number.parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',

  // Database settings
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT settings
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',

  // Gemini AI settings
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

  // MCP Server settings
  mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:3002',
  mcpServerEndpoint: process.env.MCP_SERVER_ENDPOINT || '/mcp',
  mcpServerTimeout: Number.parseInt(process.env.MCP_SERVER_TIMEOUT || '30000', 10),
};

// Validation function to ensure required environment variables are set
export function validateConfig(): void {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about missing optional but important variables
  const important = ['OPENROUTER_API_KEY', 'JWT_SECRET'];
  const missingImportant = important.filter((key) => !process.env[key]);

  if (missingImportant.length > 0) {
    console.warn(`⚠️  Missing important environment variables: ${missingImportant.join(', ')}`);
  }
}
