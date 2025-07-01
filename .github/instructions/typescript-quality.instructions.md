---
description: 
globs: 
alwaysApply: true
---
# TypeScript and Code Quality Guidelines

## Overview
This guide covers TypeScript and code quality standards for both **frontend** (React/Next.js) and **backend** (Node.js/NestJS/Prisma) projects in this monorepo. Follow the relevant sections for your area, and always apply the shared best practices.

---

## Shared TypeScript Best Practices

### Type Safety Requirements
- Follow TypeScript strict mode and resolve all compilation errors
- Use proper type annotations instead of `any` types
- Prefer explicit return types for functions when they're not obvious
- Use type assertions sparingly and only when absolutely necessary
- Leverage TypeScript's built-in utility types (Partial, Pick, Omit, etc.)

### Script and Command Execution
- **ALWAYS check package.json scripts before running TypeScript-related commands**
- **Use defined scripts for type checking, building, and linting**

```bash
# Common TypeScript script patterns:
pnpm run build             # Build TypeScript project
pnpm run type-check        # Type checking only
pnpm run lint              # ESLint with TypeScript rules
pnpm run lint:fix          # Auto-fix TypeScript linting
```

---

# Frontend TypeScript Guidelines (React/Next.js)

## Component Props and Types

- Use explicit interfaces for component props
- Prefer extending library types (e.g., HeroUI, Next.js)
- Use zod for form validation and type inference

```tsx
import { Button, type ButtonProps } from '@heroui/react';

interface CustomButtonProps extends Omit<ButtonProps, 'children'> {
  icon?: React.ReactNode;
  label: string;
  isLoading?: boolean;
}

export function CustomButton({ 
  icon, 
  label, 
  isLoading, 
  ...heroUIProps 
}: CustomButtonProps) {
  return (
    <Button {...heroUIProps} isDisabled={isLoading}>
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Button>
  );
}
```

## API Response Types

```tsx
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Usage
const fetchUser = async (id: string): Promise<ApiResponse<User>> => {
  // Implementation
};
```

## Form Data Types and Validation

```tsx
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be at least 18'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  initialData?: Partial<UserFormData>;
}
```

## Custom Hooks

- Use generic types for hooks
- Always type hook options and return values

```tsx
import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  url: string, 
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

## Import Organization (Frontend)
```tsx
// 1. React and core libraries
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
// 2. External libraries
import { Button, Input } from '@heroui/react';
import { z } from 'zod';
// 3. Internal utilities and hooks
import { useApi } from '../hooks/useApi';
import { validateForm } from '../utils/validation';
// 4. Internal components
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
// 5. Types and interfaces
import type { User, ApiResponse } from '../types';
```

---

# Backend TypeScript Guidelines (Node.js/NestJS/Prisma)

## DTOs and API Types
- Use TypeScript interfaces or classes for DTOs (Data Transfer Objects)
- Use NestJS decorators for validation and transformation
- Prefer explicit types for service and controller methods

```ts
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

## Prisma Types
- Use `@prisma/client` types for database models
- Avoid using `any` for Prisma query results

```ts
import { User } from '@prisma/client';

async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
```

## Service and Controller Patterns
- Always type function parameters and return values
- Use DTOs for input validation
- Use enums for status and roles

```ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Controller example
@Get(':id')
async getUser(@Param('id') id: string): Promise<ApiResponse<User>> {
  // ...
}
```

## Import Organization (Backend)
```ts
// 1. Node/NestJS core
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// 2. External libraries
import { User } from '@prisma/client';
// 3. Internal modules/services
import { CreateUserDto } from './dto/create-user.dto';
// 4. Types and interfaces
import type { ApiResponse } from '../types/api-response.type';
```

---

## Code Quality Standards (Both)

### Function and Variable Naming
- Use meaningful variable and function names that self-document
- Use camelCase for variables and functions
- Use PascalCase for components and classes
- Use UPPER_SNAKE_CASE for constants
- Prefer descriptive names over comments when possible

### Error Handling
- Use proper error handling and validation patterns
- Implement try-catch blocks for async operations
- Use Result/Either patterns for functions that might fail
- Validate input at boundaries (API endpoints, component props)

### Export Patterns
```ts
// Named exports for utilities
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Default export for main component/class
export default class UserService { /* ... */ }

// Re-exports in index files
export { UserService } from './user.service';
export type { User, ApiResponse } from './types';
```

---

## Testing Type Definitions

### Frontend Example
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

interface TestComponentProps {
  initialValue?: string;
  onSubmit?: (value: string) => void;
}

type SetupOptions = {
  initialProps?: Partial<TestComponentProps>;
  renderOptions?: Parameters<typeof render>[1];
};

const setup = (options: SetupOptions = {}) => {
  const user = userEvent.setup();
  const mockOnSubmit = jest.fn();
  const props: TestComponentProps = {
    onSubmit: mockOnSubmit,
    ...options.initialProps,
  };
  const result = render(<TestComponent {...props} />, options.renderOptions);
  return { user, mockOnSubmit, ...result };
};
```

### Backend Example
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Performance Considerations
- Follow React performance best practices (useMemo, useCallback when needed)
- Avoid creating objects and functions in render methods
- Use proper dependency arrays in hooks
- Consider lazy loading for large components (frontend)
- For backend, avoid N+1 queries, use efficient DB access patterns

## Code Organization
- Group related functionality into logical modules
- Extract reusable utilities into separate files
- Follow consistent naming conventions across the codebase
- Maintain clear separation between business logic and UI components (frontend) or services/controllers (backend)
- Use barrel exports (index.ts files) for clean imports

---

## References
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev/)

