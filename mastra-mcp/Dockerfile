FROM node:20-alpine

RUN npm install -g pnpm@latest

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml ./

# Copy workspace configuration
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy the mastra-mcp project
COPY mastra-mcp/src ./src
COPY mastra-mcp/tsconfig.app.json ./
COPY mastra-mcp/project.json ./

# Copy Docker-specific tsconfig
COPY mastra-mcp/tsconfig.docker.json ./tsconfig.json

# Install dependencies
RUN pnpm install --frozen-lockfile

EXPOSE 4111

CMD ["pnpm", "exec", "mastra", "dev"]
