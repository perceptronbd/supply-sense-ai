# Use the base image with shared setup and Prisma client
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files from monorepo root
COPY package.json pnpm-lock.yaml* ./

# Copy Nx configuration files
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy shared libraries (including Prisma schema)
COPY libs ./libs

# Generate Prisma client once for the entire monorepo
RUN npx prisma generate --schema=libs/shared/prisma/schema.prisma

# MCP Server-specific stage
FROM base AS mcp-build

# Copy only the MCP server source code
COPY mastra-mcp-server ./mastra-mcp-server

# Build the MCP server application using nx directly (faster)
RUN npx nx build mastra-mcp-server

# Prepare production dependencies only
FROM mcp-build AS mcp-prod-deps
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile

# Production stage - use a smaller base image
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mcpuser

# Copy built application from build stage
COPY --from=mcp-build --chown=mcpuser:nodejs /app/dist/mastra-mcp-server ./dist
COPY --from=mcp-prod-deps --chown=mcpuser:nodejs /app/node_modules ./node_modules
COPY --from=mcp-build --chown=mcpuser:nodejs /app/libs/shared/prisma/generated ./libs/shared/prisma/generated

USER mcpuser

# Expose port (MCP server port)
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start the application
CMD ["node", "dist/main.mjs"]
