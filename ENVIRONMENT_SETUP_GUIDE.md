# Environment Configuration Setup Guide

## Overview

This document provides comprehensive guidelines for setting up and managing environment variables in the SupplySense AI backend. All environment configuration is centralized through a single configuration file (`backend/src/config/app.config.ts`) to ensure consistency, type safety, and maintainability.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Structure](#configuration-structure)
- [Environment Variables Reference](#environment-variables-reference)
- [Setup Instructions](#setup-instructions)
- [Development vs Production](#development-vs-production)
- [Validation and Error Handling](#validation-and-error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Update the values in `backend/.env` with your configuration

3. The application will automatically load and validate the configuration on startup

## Configuration Structure

All backend configuration is managed through a centralized configuration system:

### Configuration File Location
```
backend/src/config/app.config.ts
```

### AppConfig Interface
```typescript
export interface AppConfig {
  // Server settings
  port: number;
  nodeEnv: string;
  apiPrefix: string;

  // Database settings
  databaseUrl: string;
  publicDbConnectionId: string;

  // JWT settings
  jwtSecret: string;

  // Gemini AI settings
  geminiApiKey: string;
  geminiModel: string;

  // MCP Server settings
  mcpServerUrl: string;
  mcpServerEndpoint: string;
  mcpServerTimeout: number;

  // Mastra Client settings
  mastraServerUrl: string;

  // Security & Encryption settings
  dbEncryptionKey: string;

  // Frontend settings
  frontendUrls: string;

  // API Keys
  openrouterApiKey: string;

  // Rate limiting
  rateLimitConfig: string;
}
```

## Environment Variables Reference

### Server Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | `3004` | Backend server port |
| `NODE_ENV` | string | `development` | Application environment (development/production/staging) |
| `API_PREFIX` | string | `api` | API endpoint prefix |

### Database Settings

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `DATABASE_URL` | string | `''` | ✓ | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/dbname`) |
| `PUBLIC_DB_CONNECTION_ID` | string | `''` | | ID for public database connection |

**Database URL Format:**
```
postgresql://username:password@hostname:port/database_name
```

**Example:**
```
DATABASE_URL="postgresql://admin:securepass@localhost:5432/supplysense"
```

### JWT Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `JWT_SECRET` | string | `your-super-secret-jwt-key-change-in-production` | Secret key for JWT token signing (should be changed in production) |

**⚠️ Security Warning:** Always change the default JWT secret in production environments.

### Gemini AI Settings

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `GEMINI_API_KEY` | string | `''` | | Google Gemini API key for AI features |
| `GEMINI_MODEL` | string | `gemini-2.0-flash` | | Gemini model to use (e.g., `gemini-2.0-flash`, `gemini-pro`) |

**How to Obtain:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### MCP Server Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MCP_SERVER_URL` | string | `http://localhost:3002` | URL of the MCP (Model Context Protocol) server |
| `MCP_SERVER_ENDPOINT` | string | `/mcp` | MCP server endpoint path |
| `MCP_SERVER_TIMEOUT` | number | `120000` | MCP request timeout in milliseconds (default: 2 minutes) |

### Mastra Client Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MASTRA_SERVER_URL` | string | `http://localhost:4111` | URL of the hosted Mastra server for MCP client connections |

**Example for Hosted Mastra:**
```
MASTRA_SERVER_URL=https://supplysense-mcp.perceptronbd.com
```

### Security & Encryption

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `DB_ENCRYPTION_KEY` | string | `''` | | Encryption key for database credentials (should be a secure random string) |

**Generating a Secure Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `FRONTEND_URLS` | string | `http://localhost:3000,http://localhost:3001` | Comma-separated list of allowed frontend URLs for CORS (must include protocol and host) |

**Format:**
```
FRONTEND_URLS="https://app.example.com,http://localhost:3000,https://staging.example.com:8080"
```

**Important:** Each URL must include the protocol (http/https) and cannot include trailing slashes or pathname.

### API Keys

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `OPENROUTER_API_KEY` | string | `''` | | OpenRouter API key for AI model access |

### Rate Limiting

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMIT_CONFIG` | string | `'[{"name":"minute","window":"1m","maxRequests":5},{"name":"hour","window":"1h","maxRequests":30},{"name":"day","window":"1d","maxRequests":200}]'` | JSON configuration for multi-window rate limiting |

**Format:**
```json
[
  {
    "name": "minute",
    "window": "1m",
    "maxRequests": 5
  },
  {
    "name": "hour",
    "window": "1h",
    "maxRequests": 30
  },
  {
    "name": "day",
    "window": "1d",
    "maxRequests": 200
  }
]
```

**Window Units:** `s` (seconds), `m` (minutes), `h` (hours), `d` (days)

## Setup Instructions

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/perceptronbd/supply-sense-ai.git
   cd supply-sense-ai
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment file:**
   ```bash
   cp backend/.env.example backend/.env
   ```

4. **Configure required variables:**
   ```bash
   # Edit backend/.env with your values
   vim backend/.env
   ```

   Minimum required variables for development:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/supplysense"
   DB_ENCRYPTION_KEY="your-secure-encryption-key"
   JWT_SECRET="your-secret-key-for-development"
   GEMINI_API_KEY="your-gemini-api-key"
   MASTRA_SERVER_URL="http://localhost:4111"
   FRONTEND_URLS="http://localhost:3000,http://localhost:3001"
   ```

5. **Run database migrations:**
   ```bash
   pnpm run db:migrate
   ```

6. **Start the backend:**
   ```bash
   pnpm run dev
   ```

### Docker Deployment

When deploying with Docker, pass environment variables through:

```bash
docker run -e DATABASE_URL="postgresql://..." \
           -e JWT_SECRET="your-secret" \
           -e GEMINI_API_KEY="your-key" \
           -e MASTRA_SERVER_URL="https://your-mastra-url.com" \
           supply-sense-ai-backend
```

Or use a `.env` file with Docker Compose:

```yaml
version: '3.8'
services:
  backend:
    image: supply-sense-ai-backend
    env_file:
      - backend/.env
    ports:
      - "3004:3004"
```

## Development vs Production

### Development Environment

```env
NODE_ENV=development
PORT=3004
FRONTEND_URLS=http://localhost:3000,http://localhost:3001
MASTRA_SERVER_URL=http://localhost:4111
MCP_SERVER_TIMEOUT=120000
```

### Production Environment

```env
NODE_ENV=production
PORT=3004
FRONTEND_URLS=https://app.example.com,https://www.example.com
MASTRA_SERVER_URL=https://mastra.example.com
JWT_SECRET=<change-to-strong-secret>
DB_ENCRYPTION_KEY=<use-secure-random-key>
GEMINI_API_KEY=<your-production-key>
OPENROUTER_API_KEY=<your-production-key>
```

### Staging Environment

```env
NODE_ENV=staging
FRONTEND_URLS=https://staging-app.example.com
MASTRA_SERVER_URL=https://staging-mastra.example.com
```

## Validation and Error Handling

### Automatic Validation

The application validates required environment variables on startup:

```typescript
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
```

### Startup Logging

The application logs configuration information on startup:

```
⚙️  Environment: production
🔗 Frontend CORS URLs: https://app.example.com,https://www.example.com
🗃️  Database: Connected via env var
🔐 JWT Secret: Configured
🤖 AI Model: gemini-2.0-flash
🔑 Gemini API: Configured
🚀 Application is running on: http://localhost:3004/api
```

## Using Configuration in Code

All services should import and use `appConfig` instead of accessing `process.env` directly:

### Correct ✓

```typescript
import { appConfig } from '@/config/app.config';

// In your service
constructor() {
  this.port = appConfig.port;
  this.jwtSecret = appConfig.jwtSecret;
  this.mastraUrl = appConfig.mastraServerUrl;
}
```

### Incorrect ✗

```typescript
// Don't use process.env directly
constructor() {
  this.port = process.env.PORT;
  this.jwtSecret = process.env.JWT_SECRET;
}
```

## Best Practices

### 1. **Never Commit `.env` Files**
   ```bash
   # .gitignore should contain:
   backend/.env
   backend/.env.local
   .env
   ```

### 2. **Use `.env.example` for Documentation**
   - Keep `backend/.env.example` updated with all available variables
   - Use it as a template for new developers

### 3. **Secure Sensitive Values**
   - Never log sensitive variables (API keys, secrets, passwords)
   - Use secure vaults for production secrets
   - Rotate secrets regularly

### 4. **Environment-Specific Values**
   - Use different values for development, staging, and production
   - Document which variables differ per environment

### 5. **Type Safety**
   - Always define configuration through the `AppConfig` interface
   - Use TypeScript for compile-time checking

### 6. **Consistent Import Paths**
   ```typescript
   // Use absolute paths consistently
   import { appConfig } from '@/config/app.config';
   ```

### 7. **Default Values**
   - Provide sensible defaults for development
   - Require production values to be explicitly set

## Troubleshooting

### Issue: "DATABASE_URL is not set"

**Solution:**
1. Check if `backend/.env` file exists
2. Verify `DATABASE_URL` is present and not empty
3. Test the connection string locally:
   ```bash
   psql "your-connection-string"
   ```

### Issue: "CORS error - origin not allowed"

**Solution:**
1. Verify `FRONTEND_URLS` environment variable is set
2. Ensure the URL includes protocol (http/https)
3. Check there are no extra spaces or trailing slashes
4. Review server logs for detailed CORS debug information

### Issue: "JWT authentication failed"

**Solution:**
1. Ensure `JWT_SECRET` is set and consistent across the application
2. Verify JWT tokens are being generated with the correct secret
3. In development, you can check the token using [jwt.io](https://jwt.io)

### Issue: "Gemini API features not working"

**Solution:**
1. Verify `GEMINI_API_KEY` is set
2. Check API key is valid in Google AI Studio
3. Ensure the API is enabled in your Google Cloud project
4. Check server logs for specific error messages

### Issue: "MCP client connection failed"

**Solution:**
1. Verify `MASTRA_SERVER_URL` is correct and accessible
2. Test connectivity: `curl https://your-mastra-url.com`
3. Check if MCP server is running and healthy
4. Review network connectivity and firewall rules

### Issue: "Rate limiting not working"

**Solution:**
1. Verify `RATE_LIMIT_CONFIG` JSON is valid
2. Use online JSON validator to check syntax
3. Ensure window values use correct format (e.g., "1m", "1h", "1d")
4. Check database connection for storing rate limit state

## Contributing

When adding new environment variables:

1. Add the property to the `AppConfig` interface in `backend/src/config/app.config.ts`
2. Add the variable definition in the `appConfig` object with default value
3. Update `backend/.env.example` with the new variable
4. Update this documentation with the new variable details
5. Ensure all services use the configuration through `appConfig`

## Support

For issues or questions regarding environment setup:
- Check the [Troubleshooting](#troubleshooting) section
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment-specific instructions
- Open an issue on the [GitHub repository](https://github.com/perceptronbd/supply-sense-ai/issues)

## Additional Resources

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Environment Variables Best Practices](https://12factor.net/config)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [JWT Introduction](https://jwt.io/introduction)
