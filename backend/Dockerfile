# Use the base image with shared setup and Prisma client
FROM node:18-alpine AS base

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

# Backend-specific stage
FROM base AS backend-build

# Copy only the backend source code
COPY backend ./backend

# Build the backend application using pnpm from root
RUN pnpm run backend:build

# Set final working directory
WORKDIR /app/backend

# Expose port (default NestJS port)
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the application
CMD ["node", "dist/main"]
