# Supply Chain AI Management System - Development Instructions

## Project Overview

This is a comprehensive NestJS supply chain AI management system backend with Swagger/OpenAPI documentation, JWT authentication, and Prisma database integration.

## Package Manager

**⚠️ IMPORTANT: This project uses `pnpm` as the package manager.**

### Installation Commands

```bash
# Install dependencies
pnpm install

# Add new packages
pnpm add <package-name>

# Add dev dependencies
pnpm add -D <package-name>

# Run scripts
pnpm run <script-name>
```

## Pre-installed Packages

### Validation & Transformation

- ✅ `class-validator` - Already installed for DTO validation
- ✅ `class-transformer` - Already installed for data transformation
- ✅ `@nestjs/swagger` - Already installed for API documentation

### Authentication

- ✅ `@nestjs/jwt` - Already installed for JWT token handling
- ✅ `@nestjs/passport` - Already installed for authentication strategies
- ✅ `passport` - Already installed for authentication middleware
- ✅ `passport-jwt` - Already installed for JWT strategy
- ✅ `@types/passport-jwt` - Already installed for TypeScript support

### Database

- ✅ `@prisma/client` - Already installed for database operations
- ✅ `prisma` - Already installed for database schema management

## Development Workflow

### Starting the Development Server

```bash
# Start database and backend server
pnpm start:dev

# Or run individually
pnpm run db:start    # Start PostgreSQL in Docker
pnpm run backend:serve    # Start NestJS development server
```

### Database Operations

```bash
# Generate Prisma client after schema changes
pnpm run db:generate

# Apply database migrations
pnpm run db:migrate

# Seed the database
pnpm run db:seed

# Reset database (development only)
pnpm run db:reset
```

### Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm run test:e2e

# Run tests with coverage
pnpm run test:cov
```

## API Documentation

- **Base URL**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/api/docs`

## Authentication

The system uses JWT authentication with the following endpoints:

- `POST /api/auth/login` - User login

### Test Credentials

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

## Database

- **Type**: PostgreSQL (Docker container)
- **Port**: 5432
- **Database**: supply_chain_ai
- **Schema**: Managed by Prisma

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app/                    # Core application modules
│   └── modules/                # Feature modules
│       ├── auth/               # Authentication module
│       ├── purchase-request/   # Purchase Request management
│       ├── purchase-order/     # Purchase Order management
│       ├── goods-receipt/      # Goods Receipt management
│       ├── material-requisition/ # Material Requisition management
│       ├── request-form/       # Request Form management
│       ├── manufacturing-list/ # Manufacturing List management
│       └── formula/           # Formula management
└── prisma/
    ├── schema.prisma          # Database schema
    ├── seed.ts               # Database seeding
    └── migrations/           # Database migrations
```

## Important Notes

### Validation Configuration

- Global ValidationPipe is configured in `main.ts`
- Use `class-validator` decorators in DTOs for input validation
- Use `class-transformer` for data transformation

### UUID Handling

- The system uses standard UUID format (v4)
- Prisma schema is configured with `@default(uuid())`
- All entity IDs are UUIDs

### Error Handling

- Standard NestJS exception filters
- Proper HTTP status codes
- Comprehensive error messages

## Common Issues & Solutions

### ValidationPipe Issues

If you encounter validation errors:

1. Ensure DTOs have proper `class-validator` decorators
2. Check that ValidationPipe is properly configured in `main.ts`
3. Verify that required packages are installed: `class-validator`, `class-transformer`

### Package Installation

Always use `pnpm` instead of npm or yarn:

```bash
# ❌ Don't use
npm install package-name
yarn add package-name

# ✅ Use this
pnpm add package-name
```

### Database Connection

If database connection fails:

1. Ensure Docker is running
2. Run `pnpm run db:start` to start PostgreSQL container
3. Check if port 5432 is available

## Development Status

- ✅ JWT Authentication system implemented
- ✅ Swagger documentation configured
- ✅ Database schema and seeding complete
- ✅ All CRUD endpoints implemented
- ✅ Role-based access control
- ✅ UUID validation working correctly

## Next Steps

1. Complete authentication testing with JWT tokens
2. Implement comprehensive API testing
3. Add production-ready security configurations
4. Deploy to production environment
