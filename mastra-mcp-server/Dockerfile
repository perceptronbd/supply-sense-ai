# Use Node.js 18 Alpine as base image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files from monorepo root
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy only the MCP server source code
COPY mastra-mcp-server ./mastra-mcp-server
COPY libs ./libs

# Set working directory to MCP server
WORKDIR /app/mastra-mcp-server

# Generate Prisma client if schema exists
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# Build the MCP server application using pnpm from root
WORKDIR /app
RUN pnpm run mcp-server:build

# Set final working directory
WORKDIR /app/mastra-mcp-server

# Expose port (MCP server port)
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start the application
CMD ["node", "dist/main"]
