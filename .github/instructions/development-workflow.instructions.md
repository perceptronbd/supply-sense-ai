# Development Workflow Guidelines

## Project Architecture
This is a **Supply Chain Management AI** system built with:
- **Backend**: NestJS with TypeScript ([backend/](mdc:backend))
- **Frontend**: Next.js with TypeScript ([frontend/](mdc:frontend))
- **Database**: PostgreSQL with Prisma ORM
- **MCP Server**: Mastra MCP server for AI agent functionality
- **Monorepo**: Nx workspace with pnpm package management
- **Container**: Docker for PostgreSQL database
- **Code Quality**: Biome for linting and formatting

## Complete Development Setup

### 1. Environment Setup
```bash
# Clone and setup
git clone <repository>
cd supply-sense-ai

# Install dependencies (pnpm only!)
pnpm install

# Setup environment files
# Create backend/.env (see backend/example.env)
# Create frontend/.env.local
```

### 2. Database Setup
```bash
# Start PostgreSQL container
pnpm run db:start

# Setup database schema and seed data
cd backend
npx prisma migrate dev
npx tsx prisma/seed.ts
cd ..
```

### 3. Development Server Startup

#### Full Stack Development (Frontend + Backend)
```bash
# 1. Start database first
pnpm run db:start

# 2. Start MCP server and WAIT for it to be ready
pnpm run mcp-server:serve            # Wait for "MCP server ready" or similar message

# 3. Start backend server (in new terminal)
pnpm run backend:serve               # Backend depends on MCP server

# 4. Start frontend (in another new terminal)
pnpm run frontend:serve              # Frontend connects to backend
```

#### Backend-Only Development
```bash
# 1. Start database first
pnpm run db:start

# 2. Start MCP server and WAIT for it to be ready
pnpm run mcp-server:serve            # Wait for MCP server to initialize

# 3. Start backend server (in new terminal)
pnpm run backend:serve               # Backend depends on MCP server
```

#### Quick Start (Database + Backend only)
```bash
# This script only starts database + backend
# You still need MCP server running separately first
pnpm run start:dev                   # Database + Backend (but requires MCP server running)
```

## Daily Development Workflow

### Starting Development
```bash
# 1. Pull latest changes
git pull origin develop

# 2. Install any new dependencies
pnpm install

# 3. Apply any new database migrations
cd backend
npx prisma migrate dev
cd ..

# 4. Start development servers in correct order:

# Terminal 1: Start database
pnpm run db:start

# Terminal 2: Start MCP server (WAIT for it to be ready)
pnpm run mcp-server:serve            # Wait for initialization complete

# Terminal 3: Start backend server (after MCP is ready)
pnpm run backend:serve

# Terminal 4: Start frontend (optional, for full-stack development)
pnpm run frontend:serve
```

### Working with Backend ([backend/](mdc:backend))
```bash
# Start backend development server
pnpm run backend:serve               # From root directory
# OR
cd backend && npx nx serve backend   # From backend directory

# Run tests
pnpm run backend:test                # Unit tests from root
npx nx e2e backend-e2e              # E2E tests

# Database operations
cd backend
npx prisma studio                    # Database GUI
npx prisma generate                  # Regenerate client
npx prisma migrate dev               # Create new migration
npx tsx prisma/seed.ts              # Re-seed database

# Build backend
pnpm run backend:build               # From root
```

### Working with Frontend ([frontend/](mdc:frontend))
```bash
# Start frontend development server
pnpm run frontend:serve              # From root directory (uses nx dev)
# OR
cd frontend && npx nx dev frontend   # From frontend directory

# Testing
pnpm run frontend:test               # Run tests from root
npx nx e2e frontend-e2e             # Run E2E tests

# Build frontend
pnpm run frontend:build              # From root
```

### Working with MCP Server ([mastra-mcp/](mdc:mastra-mcp))
```bash
# Start MCP server (for AI agent functionality)
pnpm run mcp-server:serve            # From root directory

# Build MCP server
pnpm run mcp-server:build            # From root directory
```

### Code Quality & Formatting
```bash
# Linting with Biome
pnpm run lint                        # Check code quality
pnpm run lint:fix                    # Fix issues automatically

# Formatting with Biome
pnpm run format                      # Format code
pnpm run format:check                # Check formatting without changes
```

## Environment Configuration

### Backend Environment ([backend/.env](mdc:backend/.env))
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/supply_chain_db"

# Server Configuration  
PORT=3004
NODE_ENV=development

# CORS Configuration
FRONTEND_URLS="http://localhost:3001,http://localhost:3003"

# Authentication
JWT_SECRET="your-jwt-secret-key"

# AI Configuration (Optional)
GEMINI_API_KEY="your-gemini-api-key"
AI_MODEL="gemini-2.0-flash"
```

### Frontend Environment ([frontend/.env.local](mdc:frontend/.env.local))
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3004
```

## Permission-Based Access Control
The system uses **pure permission-based access control**:

### Key Features
- **43 distinct permissions** across all modules
- **No role-based restrictions** - only permission checks
- **Super Admin bypass** - automatically has all permissions
- **Dynamic role creation** - any combination of permissions

### Demo Users ([backend/prisma/seed.ts](mdc:backend/prisma/seed.ts))
```bash
# Super Admin (Company 1)
Email: admin@company001.com
Password: admin123

# Super Admin (Company 2)  
Email: admin@company002.com
Password: admin123
```

## Common Development Tasks

### Adding New Features
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Backend changes
pnpm run backend:serve               # Start backend for development
# Add controllers, services, DTOs
# Update Prisma schema if needed
cd backend && npx prisma migrate dev --name add_new_feature

# 3. Frontend changes
pnpm run frontend:serve              # Start frontend for development
# Add components, pages, API calls

# 4. Test changes
pnpm run backend:test
pnpm run frontend:test
pnpm run backend:build
pnpm run frontend:build
```

### Database Schema Changes
```bash
cd backend

# 1. Modify prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_change

# 3. Update seed data if needed
# Edit prisma/seed.ts

# 4. Reset database for testing
npx prisma migrate reset --force
npx tsx prisma/seed.ts
```

### API Development Pattern
1. **Define DTOs** in `dto/` folders
2. **Create services** with business logic
3. **Build controllers** with permission decorators
4. **Add validation** using class-validator
5. **Update frontend API** in `store/api/` files

## Error Resolution Patterns

### Backend Compilation Errors
```bash
# Check TypeScript compilation
cd backend
npx tsc --noEmit

# Build with pnpm script
pnpm run backend:build

# Common fixes:
# - Import missing dependencies
# - Add missing decorators (@Injectable, @Controller)
# - Fix method signatures in controllers/services
```

### Frontend Build Errors
```bash
# Check TypeScript compilation
cd frontend
npx tsc --noEmit

# Build with pnpm script
pnpm run frontend:build

# Common fixes:
# - Update API endpoint calls
# - Fix TypeScript types
# - Update import paths
```

### Database Connection Issues
```bash
# Check container status
docker ps

# Restart database
pnpm run db:stop
pnpm run db:start

# Reset database completely
pnpm run db:stop
pnpm run db:start
cd backend
npx prisma migrate reset --force
npx tsx prisma/seed.ts
```

### Code Quality Issues
```bash
# Fix all linting and formatting issues
pnpm run lint:fix
pnpm run format

# Check issues without fixing
pnpm run lint
pnpm run format:check
```

## Code Quality Standards

### TypeScript Rules
- **Strict mode enabled** in all projects
- **No `any` types** - use proper typing
- **Consistent naming** - camelCase for variables, PascalCase for classes
- **Import organization** - group and sort imports

### Backend Standards ([backend/](mdc:backend))
- **NestJS conventions** - decorators, dependency injection
- **Permission-based access** - use `@RequirePermissions()` decorator
- **Error handling** - use NestJS exception filters
- **Validation** - use class-validator DTOs

### Frontend Standards ([frontend/](mdc:frontend))
- **Next.js 14** with App Router
- **RTK Query** for API state management
- **Tailwind CSS** for styling
- **TypeScript** for all components

### Code Quality Tools
- **Biome** for linting and formatting (replaces ESLint + Prettier)
- **Husky** for git hooks
- **lint-staged** for pre-commit checks

## Performance & Monitoring

### Development Monitoring
```bash
# Backend performance
pnpm run backend:serve               # Start with hot reload

# Frontend performance  
pnpm run frontend:serve              # Hot reload enabled with Next.js

# MCP Server (AI features)
pnpm run mcp-server:serve            # Start AI agent server
```

### Production Build Testing
```bash
# Test production builds
pnpm run backend:build
pnpm run frontend:build
pnpm run mcp-server:build

# Or build all at once
npx nx build --all
```

## Available Scripts Summary

### Primary Development Commands
```bash
# IMPORTANT: Follow this startup sequence!

# 1. Database (always first)
pnpm run db:start                    # Start PostgreSQL

# 2. MCP Server (wait for ready before proceeding)
pnpm run mcp-server:serve            # Start AI agent server - WAIT for initialization

# 3. Backend (after MCP server is ready)
pnpm run backend:serve               # Start backend (depends on MCP server)

# 4. Frontend (optional, for full-stack development)
pnpm run frontend:serve              # Start frontend (separate terminal)

# Alternative: Quick database + backend (but still need MCP server first!)
pnpm run start:dev                   # Database + Backend only (MCP must be running)
```

### Database Management
```bash
pnpm run db:start                    # Start PostgreSQL
pnpm run db:stop                     # Stop PostgreSQL  
pnpm run db:seed                     # Seed database
```

### Building & Testing
```bash
pnpm run backend:build               # Build backend
pnpm run frontend:build              # Build frontend
pnpm run mcp-server:build            # Build MCP server
pnpm run backend:test                # Test backend
pnpm run frontend:test               # Test frontend
```

### Code Quality
```bash
pnpm run lint                        # Check with Biome
pnpm run lint:fix                    # Fix with Biome
pnpm run format                      # Format with Biome
pnpm run format:check                # Check formatting
```

Remember: **Always use pnpm** and **always use command line tools** for consistency and reliability.







