# Environment Variables Configuration

This document describes the environment variables used across the SupplySense AI application.

## Backend (.env)

Copy `backend/example.env` to `backend/.env` and configure:

```bash
# Database connection string for PostgreSQL
DATABASE_URL="postgresql://admin:password@localhost:5432/supply_chain_ai?schema=public"

# Application settings
NODE_ENV=development
PORT=3000

# JWT settings
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API settings
API_PREFIX=api

# Google Gemini AI settings
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash

# MCP Server settings
MCP_SERVER_URL=http://localhost:3002
MCP_SERVER_ENDPOINT=/mcp
MCP_SERVER_TIMEOUT=30000
```

## Frontend (.env.local)

Copy `frontend/.env.example` to `frontend/.env.local` and configure:

```bash
NEXT_PUBLIC_API_URL="http://localhost:3004"
```

## Mastra MCP Server (.env)

Copy `mastra-mcp-server/.env.example` to `mastra-mcp-server/.env` and configure:

```bash
# Gemini API Key (required for the AI agent)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here

# Server Configuration
NODE_ENV=development
PORT=3333
MCP_PORT=3002
MCP_HOST=localhost
```

## Backend E2E Tests (.env)

Copy `backend-e2e/.env.example` to `backend-e2e/.env` and configure:

```bash
# API Base URL for testing (default: backend dev server)
API_BASE_URL=http://localhost:3004

# WebSocket URL for chat testing
WS_URL=http://localhost:3004/chat
```

## Frontend E2E Tests (.env)

Copy `frontend-e2e/.env.example` to `frontend-e2e/.env` and configure:

```bash
# Cypress Base URL for testing (default: frontend dev server)
CYPRESS_BASE_URL=http://localhost:3000
```

## Default Port Configuration

- **Frontend (Next.js)**: 3000
- **Backend (NestJS)**: 3004 (changed from 3000 to avoid conflicts)
- **Mastra MCP Server**: 3002
- **Database (PostgreSQL)**: 5432

## Security Notes

1. **Never commit `.env` files** - they contain sensitive information
2. **Use strong JWT secrets** in production
3. **Rotate API keys regularly**
4. **Use different databases** for development, testing, and production
5. **Set NODE_ENV=production** in production environments

## Environment-Specific Configurations

### Development
- Use localhost URLs
- Enable debug logging
- Use development database

### Testing
- Use test-specific API URLs
- Use test database
- Mock external services when needed

### Production
- Use production domain URLs
- Use environment-specific secrets
- Enable production optimizations
- Use production database with proper security

## Configuration Validation

The backend includes configuration validation that will:
- **Error** for missing required variables (DATABASE_URL)
- **Warn** for missing important variables (GEMINI_API_KEY, JWT_SECRET)
- Use sensible defaults for optional variables

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**
   - Check MCP_SERVER_URL and MCP_SERVER_ENDPOINT
   - Ensure Mastra MCP Server is running on the correct port
   - Verify network connectivity

2. **API Connection Failed**
   - Check NEXT_PUBLIC_API_URL in frontend
   - Ensure backend is running on the correct port
   - Verify CORS configuration

3. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify database credentials

4. **Gemini API Errors**
   - Check GEMINI_API_KEY is valid
   - Ensure API key has proper permissions
   - Verify API quota limits
