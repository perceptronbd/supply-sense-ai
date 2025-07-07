/**
 * Centralized route configuration with TypeScript types
 * This file defines all application routes and their access levels
 */

// Base route paths as const assertions for type safety
export const ROUTE_PATHS = {
  // Public routes
  ROOT: '/',

  // Auth routes (redirect authenticated users)
  LOGIN: '/login',
  REGISTER: '/register',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Protected routes (require authentication)
  CHAT: '/chat',
  PURCHASE_REQUESTS: '/purchase-requests',
  PURCHASE_ORDERS: '/purchase-orders',
  GOODS_RECEIPTS: '/goods-receipts',
  ITEMS: '/items',
  SUPPLIERS: '/suppliers',
  MANUFACTURING_LIST: '/manufacturing-list',
  MATERIAL_REQUISITION: '/material-requisition',
  BRANCHES: '/branches',
  REQUEST_FORMS: '/request-forms',
  USERS: '/users',
  ROLES: '/roles',
} as const;

// Create union types from the route paths
export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
export type ProtectedRoutePath =
  | (typeof ROUTE_PATHS)['DASHBOARD']
  | (typeof ROUTE_PATHS)['CHAT']
  | (typeof ROUTE_PATHS)['PURCHASE_REQUESTS']
  | (typeof ROUTE_PATHS)['PURCHASE_ORDERS']
  | (typeof ROUTE_PATHS)['GOODS_RECEIPTS']
  | (typeof ROUTE_PATHS)['ITEMS']
  | (typeof ROUTE_PATHS)['SUPPLIERS']
  | (typeof ROUTE_PATHS)['MANUFACTURING_LIST']
  | (typeof ROUTE_PATHS)['MATERIAL_REQUISITION']
  | (typeof ROUTE_PATHS)['BRANCHES']
  | (typeof ROUTE_PATHS)['REQUEST_FORMS']
  | (typeof ROUTE_PATHS)['USERS']
  | (typeof ROUTE_PATHS)['ROLES'];

export type AuthRoutePath = (typeof ROUTE_PATHS)['LOGIN'] | (typeof ROUTE_PATHS)['REGISTER'];
export type PublicRoutePath = (typeof ROUTE_PATHS)['ROOT'];

// Route configuration with access levels
export interface RouteConfig {
  path: RoutePath;
  requiresAuth: boolean;
  redirectIfAuthenticated: boolean;
  title?: string;
  description?: string;
}

// Comprehensive route configuration
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  ROOT: {
    path: ROUTE_PATHS.ROOT,
    requiresAuth: false,
    redirectIfAuthenticated: false,
    title: 'SupplySense',
    description: 'Supply Chain Management System',
  },
  LOGIN: {
    path: ROUTE_PATHS.LOGIN,
    requiresAuth: false,
    redirectIfAuthenticated: true,
    title: 'Login - SupplySense',
    description: 'Sign in to your SupplySense account',
  },
  REGISTER: {
    path: ROUTE_PATHS.REGISTER,
    requiresAuth: false,
    redirectIfAuthenticated: true,
    title: 'Register - SupplySense',
    description: 'Register your company with SupplySense',
  },
  DASHBOARD: {
    path: ROUTE_PATHS.DASHBOARD,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Dashboard - SupplySense',
    description: 'SupplySense dashboard and overview',
  },

  CHAT: {
    path: ROUTE_PATHS.CHAT,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'AI Assistant - SupplySense',
    description: 'Chat with SupplySense AI for insights and assistance',
  },
  PURCHASE_REQUESTS: {
    path: ROUTE_PATHS.PURCHASE_REQUESTS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Purchase Requests - SupplySense',
    description: 'Manage and track purchase requests',
  },
  PURCHASE_ORDERS: {
    path: ROUTE_PATHS.PURCHASE_ORDERS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Purchase Orders - SupplySense',
    description: 'Create and manage purchase orders',
  },
  GOODS_RECEIPTS: {
    path: ROUTE_PATHS.GOODS_RECEIPTS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Goods Receipts - SupplySense',
    description: 'Track incoming goods and receipts',
  },
  ITEMS: {
    path: ROUTE_PATHS.ITEMS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Items - SupplySense',
    description: 'Manage inventory items and catalog',
  },
  SUPPLIERS: {
    path: ROUTE_PATHS.SUPPLIERS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Suppliers - SupplySense',
    description: 'Manage supplier relationships and information',
  },
  MANUFACTURING_LIST: {
    path: ROUTE_PATHS.MANUFACTURING_LIST,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Manufacturing - SupplySense',
    description: 'Manufacturing planning and execution',
  },
  MATERIAL_REQUISITION: {
    path: ROUTE_PATHS.MATERIAL_REQUISITION,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Material Requisition - SupplySense',
    description: 'Request materials for production',
  },
  BRANCHES: {
    path: ROUTE_PATHS.BRANCHES,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Branches - SupplySense',
    description: 'Manage branch locations and operations',
  },
  REQUEST_FORMS: {
    path: ROUTE_PATHS.REQUEST_FORMS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Request Forms - SupplySense',
    description: 'Custom request forms and workflows',
  },
  USERS: {
    path: ROUTE_PATHS.USERS,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Users - SupplySense',
    description: 'Manage user accounts and permissions',
  },
  ROLES: {
    path: ROUTE_PATHS.ROLES,
    requiresAuth: true,
    redirectIfAuthenticated: false,
    title: 'Roles - SupplySense',
    description: 'Manage roles and permissions',
  },
} as const;

// Helper functions for route management
export const getRouteConfig = (path: RoutePath): RouteConfig | undefined => {
  return Object.values(ROUTE_CONFIG).find((config) => config.path === path);
};

export const getProtectedRoutes = (): ProtectedRoutePath[] => {
  return Object.values(ROUTE_CONFIG)
    .filter((config) => config.requiresAuth)
    .map((config) => config.path) as ProtectedRoutePath[];
};

export const getAuthRoutes = (): AuthRoutePath[] => {
  return Object.values(ROUTE_CONFIG)
    .filter((config) => config.redirectIfAuthenticated)
    .map((config) => config.path) as AuthRoutePath[];
};

export const getPublicRoutes = (): PublicRoutePath[] => {
  return Object.values(ROUTE_CONFIG)
    .filter((config) => !config.requiresAuth && !config.redirectIfAuthenticated)
    .map((config) => config.path) as PublicRoutePath[];
};

export const isProtectedRoute = (path: string): boolean => {
  const protectedRoutes = getProtectedRoutes();
  return protectedRoutes.some((route) => path.startsWith(route));
};

export const isAuthRoute = (path: string): boolean => {
  const authRoutes = getAuthRoutes();
  return authRoutes.includes(path as AuthRoutePath);
};

export const isPublicRoute = (path: string): boolean => {
  const publicRoutes = getPublicRoutes();
  return publicRoutes.includes(path as PublicRoutePath);
};
