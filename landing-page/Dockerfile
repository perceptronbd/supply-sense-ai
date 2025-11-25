# Use the base image with shared setup
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

# Copy shared libraries
COPY libs ./libs

# Landing-page-specific build stage
FROM base AS landing-page-build

# Copy only the landing-page source code
COPY landing-page ./landing-page

# Build the landing-page application using nx directly (faster)
RUN npx nx build landing-page --configuration production

# Prepare production dependencies only
FROM landing-page-build AS landing-page-prod-deps
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Production stage - use a smaller base image
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health checks and tini for proper signal handling
RUN apk add --no-cache curl tini

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from build stage
COPY --from=landing-page-build --chown=nextjs:nodejs /app/dist/landing-page ./.next
COPY --from=landing-page-build --chown=nextjs:nodejs /app/landing-page/public ./public
COPY --from=landing-page-prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=landing-page-build --chown=nextjs:nodejs /app/package.json ./

USER nextjs

# Expose port (default Next.js dev port for landing-page)
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002 || exit 1

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node_modules/.bin/next", "start", "-p", "3002"]
