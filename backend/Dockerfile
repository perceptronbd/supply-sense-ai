# Use Node.js 18 Alpine as base image for smaller size
FROM node:18-alpine

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

# Copy only the backend source code and shared libraries
COPY backend ./backend
COPY libs ./libs

# Set working directory to backend
WORKDIR /app/backend

# Generate Prisma client
RUN npx prisma generate

# Build the backend application using pnpm from root
WORKDIR /app
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
