---
description: 
globs: 
alwaysApply: false
---
# Package Management & Environment Guidelines

## Package Manager: PNPM ONLY
This project uses **pnpm** as the exclusive package manager. Never use npm or yarn.

### Essential Commands
```bash
# Install dependencies
pnpm install

# Add dependencies
pnpm add <package>                    # Production dependency
pnpm add -D <package>                 # Development dependency
pnpm add -g <package>                 # Global package

# Remove dependencies
pnpm remove <package>

# Run scripts
pnpm run <script-name>               # Run package.json scripts
pnpm run                             # List all available scripts

# Update dependencies
pnpm update                          # Update all dependencies
pnpm update <package>                # Update specific package
```

## Command Line First Approach
Always use command line tools instead of GUI alternatives:

### Development Server
```bash
# IMPORTANT: Follow this startup sequence for proper dependencies

# Full Stack Development:
# 1. Database first
pnpm run db:start                    # Start PostgreSQL container

# 2. MCP Server (WAIT for it to be ready!)
pnpm run mcp-server:serve            # Start AI agent server - wait for initialization

# 3. Backend (after MCP server is ready)
pnpm run backend:serve               # Start backend (depends on MCP server)

# 4. Frontend (separate terminal)
pnpm run frontend:serve              # Start frontend development server

# Backend-Only Development:
# 1. Database first
pnpm run db:start                    # Start PostgreSQL container

# 2. MCP Server (WAIT for it to be ready!)
pnpm run mcp-server:serve            # Start AI agent server - wait for initialization

# 3. Backend (after MCP server is ready)
pnpm run backend:serve               # Start backend (depends on MCP server)

# Database management
pnpm run db:stop                     # Stop PostgreSQL database
pnpm run db:seed                     # Seed database with sample data

# Quick start (still requires MCP server running separately)
pnpm run start:dev                   # Database + Backend only (MCP must be running first)
```

### Building & Testing
```bash
# Build projects
pnpm run backend:build               # Build backend
pnpm run frontend:build              # Build frontend
pnpm run mcp-server:build            # Build MCP server
npx nx build --all                   # Build all projects

# Testing
pnpm run backend:test                # Run backend tests
pnpm run frontend:test               # Run frontend tests
npx nx e2e backend-e2e              # Run E2E tests
```

### Code Quality
```bash
# Linting (using Biome)
pnpm run lint                        # Check code quality
pnpm run lint:fix                    # Fix linting issues automatically

# Formatting (using Biome)
pnpm run format                      # Format code
pnpm run format:check                # Check formatting without changes
```

### Database Operations
```bash
# Prisma commands (from backend directory)
cd backend
npx prisma migrate dev               # Apply migrations in development
npx prisma migrate reset --force     # Reset database and run migrations
npx prisma generate                  # Generate Prisma client
npx prisma db seed                   # Run seed script
npx tsx prisma/seed.ts              # Direct seed execution
```

## Nx Workspace Commands
This is an Nx monorepo - use Nx commands for workspace operations:

```bash
# Nx-specific commands
npx nx graph                         # View project dependency graph
npx nx run-many --target=build       # Build all projects
npx nx run-many --target=test        # Test all projects
npx nx affected --target=build       # Build only affected projects
npx nx list                          # List installed plugins
```

## Environment Configuration
The project uses environment-driven configuration:

### Backend Environment
- File: [backend/.env](mdc:backend/.env)
- Port: 3004 (configurable via PORT environment variable)
- Database: PostgreSQL via Docker
- CORS: Configured for frontend URLs

### Frontend Environment  
- File: [frontend/.env.local](mdc:frontend/.env.local)
- API URL: Configured via NEXT_PUBLIC_API_URL
- Build system: Next.js with TypeScript

## Key Package.json Scripts
Always check [package.json](mdc:package.json) scripts before running commands:

### Root Level Scripts ([package.json](mdc:package.json))
```bash
# Development servers
pnpm run start:dev                   # Start database + backend
pnpm run backend:serve               # Start backend server
pnpm run frontend:serve              # Start frontend development
pnpm run mcp-server:serve            # Start MCP server

# Database management
pnpm run db:start                    # Start PostgreSQL container
pnpm run db:stop                     # Stop PostgreSQL container
pnpm run db:seed                     # Seed database

# Building
pnpm run backend:build               # Build backend
pnpm run frontend:build              # Build frontend
pnpm run mcp-server:build            # Build MCP server

# Testing
pnpm run backend:test                # Test backend
pnpm run frontend:test               # Test frontend

# Code quality
pnpm run lint                        # Check with Biome
pnpm run lint:fix                    # Fix with Biome
pnpm run format                      # Format with Biome
pnpm run format:check                # Check formatting
```

### Backend Scripts (from backend directory)
```bash
cd backend
# Prisma operations
npx prisma studio                    # Open Prisma Studio
npx prisma generate                  # Generate client
npx prisma migrate dev               # Create/apply migration
npx tsx prisma/seed.ts              # Run seed script

# Development
npx nx serve backend                 # Alternative to pnpm run backend:serve
npx nx build backend                 # Alternative to pnpm run backend:build
npx nx test backend                  # Alternative to pnpm run backend:test
```

### Frontend Scripts (from frontend directory)
```bash
cd frontend  
# Development
npx nx dev frontend                  # Alternative to pnpm run frontend:serve
npx nx build frontend                # Alternative to pnpm run frontend:build
npx nx test frontend                 # Alternative to pnpm run frontend:test
```

## Best Practices

### Always Use Terminal Commands
- **Never** use GUI package managers or editor integrations
- **Always** run commands via terminal/command line
- **Prefer** script commands over direct tool execution
- **Check** available scripts with `pnpm run` before creating new commands

### Environment Variable Management
- Use [backend/.env](mdc:backend/.env) for backend configuration
- Use [frontend/.env.local](mdc:frontend/.env.local) for frontend configuration
- Never commit .env files to version control
- Use example.env files for documentation

### Dependency Management
- **Always** use exact package manager: `pnpm`
- **Never** mix package managers in the same project
- **Always** commit pnpm-lock.yaml file
- **Review** dependency changes in pull requests

### Command Execution Order
1. Check if there's a package.json script first: `pnpm run`
2. Use the script if available: `pnpm run <script-name>`
3. If no script exists, use direct command: `npx <tool> <args>`
4. For Nx commands, always use: `npx nx <command>`

## Common Issues & Solutions

### Port Conflicts
```bash
# Check what's using a port
netstat -ano | findstr :3004         # Windows
lsof -i :3004                        # macOS/Linux

# Kill processes using port
Stop-Process -Id <PID> -Force         # PowerShell
kill -9 <PID>                        # Unix
```

### Package Installation Issues
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Issues
```bash
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





