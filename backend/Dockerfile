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

# Backend-specific stage
FROM base AS backend-build

# Copy only the backend source code
COPY backend ./backend

# Build the backend application using nx directly (faster)
RUN npx nx build backend

# Prepare production dependencies only
FROM backend-build AS backend-prod-deps
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Production stage - use a smaller base image
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health checks and tini for proper signal handling
RUN apk add --no-cache curl tini

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application from build stage
COPY --from=backend-build --chown=nestjs:nodejs /app/dist/backend ./dist
COPY --from=backend-prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=backend-build --chown=nestjs:nodejs /app/libs/shared/prisma/generated ./libs/shared/prisma/generated

USER nestjs

# Expose port (default NestJS port)
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/main"]
