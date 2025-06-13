# Route Management System

This document describes the centralized route management system implemented for better maintainability and type safety.

## Overview

The route management system provides:
- ✅ **Centralized Route Configuration**: All routes defined in one place
- ✅ **TypeScript Type Safety**: Full type checking for route paths
- ✅ **Access Control**: Built-in authentication requirements per route
- ✅ **Maintainability**: Easy to add, modify, or remove routes
- ✅ **Reusable Hooks**: Custom hooks for route operations

## Files Structure

```
src/
├── config/
│   └── routes.ts              # Main route configuration
├── hooks/
│   └── useRoutes.ts          # Route management hooks
└── components/
    └── AuthProvider.tsx      # Updated to use route config
```

## Core Files

### 1. Route Configuration (`src/config/routes.ts`)

**Route Constants:**
```typescript
export const ROUTE_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  PURCHASE_REQUESTS: '/purchase-requests',
  PURCHASE_ORDERS: '/purchase-orders',
  // ... more routes
} as const;
```

**Route Types:**
```typescript
export type RoutePath = typeof ROUTE_PATHS[keyof typeof ROUTE_PATHS];
export type ProtectedRoutePath = typeof ROUTE_PATHS['DASHBOARD'] | /* ... */;
export type AuthRoutePath = typeof ROUTE_PATHS['LOGIN'];
export type PublicRoutePath = typeof ROUTE_PATHS['ROOT'];
```

**Route Configuration:**
```typescript
export interface RouteConfig {
  path: RoutePath;
  requiresAuth: boolean;
  redirectIfAuthenticated: boolean;
  title?: string;
  description?: string;
}
```

**Helper Functions:**
- `getRouteConfig(path)` - Get configuration for a route
- `getProtectedRoutes()` - Get all protected routes
- `getAuthRoutes()` - Get all auth-only routes
- `isProtectedRoute(path)` - Check if route requires authentication
- `isAuthRoute(path)` - Check if route redirects authenticated users

### 2. Route Hooks (`src/hooks/useRoutes.ts`)

**Main Hook - `useRoutes()`:**
```typescript
const {
  // Current route info
  currentRoute,
  currentRouteConfig,
  pathname,
  
  // Route type checks
  isCurrentRouteProtected,
  isCurrentRouteAuth,
  isCurrentRoutePublic,
  
  // Navigation helpers
  navigateTo,
  navigateToLogin,
  navigateToDashboard,
  navigateToHome,
  
  // Route utilities
  checkRouteAccess,
  
  // Route constants
  ROUTES,
} = useRoutes();
```

**Route Access Hook - `useRouteAccess(route)`:**
```typescript
const {
  routeConfig,
  requiresAuth,
  redirectIfAuthenticated,
  isProtected,
  isAuth,
  isPublic,
} = useRouteAccess(ROUTE_PATHS.DASHBOARD);
```

**Route Metadata Hook - `useRouteMetadata(route?)`:**
```typescript
const {
  title,
  description,
  path,
} = useRouteMetadata(); // Uses current route or specified route
```

## Usage Examples

### 1. Navigation with Type Safety

**Before (hardcoded strings):**
```typescript
router.push('/dashboard');
router.push('/purchase-requests/create');
```

**After (type-safe constants):**
```typescript
import { ROUTE_PATHS } from '../config/routes';

router.push(ROUTE_PATHS.DASHBOARD);
router.push(`${ROUTE_PATHS.PURCHASE_REQUESTS}/create`);
```

### 2. Using Navigation Helpers

```typescript
import { useRoutes } from '../hooks/useRoutes';

const { navigateToDashboard, navigateToLogin, navigateTo } = useRoutes();

// Type-safe navigation
navigateToDashboard();
navigateToLogin();
navigateTo(ROUTE_PATHS.CHAT);
```

### 3. Route Protection Checks

```typescript
import { useRoutes } from '../hooks/useRoutes';

const { isCurrentRouteProtected, checkRouteAccess } = useRoutes();

if (isCurrentRouteProtected && !isAuthenticated) {
  // Handle unauthorized access
}

// Check if user can access specific route
const canAccess = checkRouteAccess(ROUTE_PATHS.DASHBOARD, isAuthenticated);
```

### 4. Adding New Routes

**Step 1: Add to ROUTE_PATHS**
```typescript
export const ROUTE_PATHS = {
  // ...existing routes
  INVENTORY: '/inventory',
  REPORTS: '/reports',
} as const;
```

**Step 2: Add to ROUTE_CONFIG**
```typescript
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // ...existing configs
  INVENTORY: {
    path: ROUTE_PATHS.INVENTORY,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Inventory - SupplySense',
    description: 'Manage inventory levels and stock',
  },
};
```

**Step 3: Update Types (if needed)**
```typescript
export type ProtectedRoutePath = typeof ROUTE_PATHS['DASHBOARD'] | 
  typeof ROUTE_PATHS['CHAT'] | 
  // ...existing routes
  typeof ROUTE_PATHS['INVENTORY'] | 
  typeof ROUTE_PATHS['REPORTS'];
```

## Integration with Authentication

### AuthProvider Integration

The `AuthProvider` component now uses the route configuration:

```typescript
import { useRoutes } from '../hooks/useRoutes';
import { isProtectedRoute, isAuthRoute } from '../config/routes';

const { 
  isCurrentRouteProtected, 
  isCurrentRouteAuth, 
  navigateToLogin, 
  navigateToDashboard 
} = useRoutes();

// Automatic route protection logic
if (isCurrentRouteProtected && !isAuthenticated) {
  navigateToLogin();
}

if (isCurrentRouteAuth && isAuthenticated) {
  navigateToDashboard();
}
```

## Benefits

### 1. Type Safety
- ✅ Compile-time checking of route paths
- ✅ IntelliSense support for route constants
- ✅ Prevents typos in route strings

### 2. Maintainability
- ✅ Single source of truth for all routes
- ✅ Easy to add/modify/remove routes
- ✅ Centralized access control configuration

### 3. Developer Experience
- ✅ Custom hooks for common route operations
- ✅ Helper functions for route checking
- ✅ Consistent navigation patterns

### 4. Documentation
- ✅ Built-in route metadata (title, description)
- ✅ Clear access control rules
- ✅ Self-documenting route configuration

## Migration Guide

### From Hardcoded Strings

**Old:**
```typescript
router.push('/dashboard');
if (pathname.startsWith('/purchase-requests')) { /* ... */ }
```

**New:**
```typescript
import { ROUTE_PATHS } from '../config/routes';
import { useRoutes } from '../hooks/useRoutes';

const { navigateTo } = useRoutes();
navigateTo(ROUTE_PATHS.DASHBOARD);

if (isProtectedRoute(pathname)) { /* ... */ }
```

### From Individual Route Arrays

**Old:**
```typescript
const protectedRoutes = ['/dashboard', '/chat', '/purchase-requests'];
const authRoutes = ['/login'];
```

**New:**
```typescript
import { getProtectedRoutes, getAuthRoutes } from '../config/routes';

const protectedRoutes = getProtectedRoutes();
const authRoutes = getAuthRoutes();
```

This system provides a robust foundation for route management while maintaining type safety and improving developer experience.
