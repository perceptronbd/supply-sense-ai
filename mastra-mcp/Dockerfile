# Multi-stage build for Mastra MCP server

FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm globally for workspace commands
RUN npm install -g pnpm

# Install workspace dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY nx.json tsconfig.base.json ./
RUN pnpm install --frozen-lockfile

# Build the Mastra MCP project
FROM base AS builder
WORKDIR /app

# Copy workspace root files so pnpm can install workspace packages correctly
COPY package.json pnpm-lock.yaml* ./
COPY nx.json tsconfig.base.json ./
COPY libs ./libs
COPY mastra-mcp ./mastra-mcp

# Install workspace dependencies inside builder to create proper symlinks for workspace packages
RUN pnpm install --frozen-lockfile

# Ensure Prisma client is generated for shared usage (run from workspace root)
RUN npx prisma generate --schema=libs/shared/prisma/schema.prisma

# Build the Mastra MCP bundle by changing to the mastra-mcp directory first
# Create a symlink to help Mastra find its build directory correctly
WORKDIR /app/mastra-mcp
RUN ln -sf /app/mastra-mcp/.mastra /app/.mastra && npx mastra build --dir src/mastra
# WORKAROUND for Mastra telemetry bug:
# Inject a minimal telemetry-config.mjs so that
# instrumentation.mjs can import { telemetry } without crashing.
RUN cat <<'EOF' > .mastra/output/telemetry-config.mjs
export const telemetry = {
  enabled: false,
  serviceName: "mastra-mcp",
  disableLocalExport: false,
};
EOF

# POLYFILL for ES modules __dirname issue:
# Add __dirname and __filename polyfill to instrumentation.mjs
# This is needed because Prisma's query engine needs __dirname to locate itself
RUN node -e "\
const fs = require('fs'); \
const path = '.mastra/output/instrumentation.mjs'; \
let content = fs.readFileSync(path, 'utf8'); \
const polyfill = \`import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\n\n\`; \
const globalThisLine = 'globalThis.___MASTRA_TELEMETRY___ = true;'; \
const __dirnamePolyfill = \`const __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\nglobalThis.__dirname = __dirname;\nglobalThis.__filename = __filename;\n\`; \
if (!content.includes('globalThis.__dirname')) { \
  const lines = content.split('\\n'); \
  const globalThisIdx = lines.findIndex(l => l.includes(globalThisLine)); \
  lines.splice(0, 0, polyfill.trim()); \
  lines.splice(lines.findIndex(l => l.includes(globalThisLine)), 0, __dirnamePolyfill.trim()); \
  fs.writeFileSync(path, lines.join('\\n')); \
} \
"
WORKDIR /app

# Install production dependencies for the build output
FROM base AS prod-deps
WORKDIR /app
COPY --from=builder /app/mastra-mcp/.mastra/output/package.json ./package.json
COPY --from=builder /app/mastra-mcp/.mastra/output/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Install tini for proper signal handling
RUN apk add --no-cache tini

ENV NODE_ENV=production
ENV PORT=3005
ENV MCP_PORT=3005
ENV MCP_HOST=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 mastra

# Copy application build output and dependencies
COPY --from=builder --chown=mastra:nodejs /app/mastra-mcp/.mastra/output ./
COPY --from=prod-deps --chown=mastra:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mastra:nodejs /app/libs/shared/prisma/generated ./libs/shared/prisma/generated

# Ensure storage directory exists with correct permissions
RUN mkdir -p storage && chown -R mastra:nodejs /app

USER mastra
EXPOSE 3005

# Use tini to manage signals when running the Mastra MCP server
ENTRYPOINT ["/sbin/tini", "--"]

# Start Mastra MCP with instrumentation (telemetry-config is now valid)
CMD ["node", "--import=./instrumentation.mjs", "./index.mjs"]
