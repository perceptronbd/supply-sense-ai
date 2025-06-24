/**
 * Permission types for consistent usage across the application
 * Format: RESOURCE:ACTION
 */

// Define Resources - Ordered by hierarchy: Core entities first, then business modules
export const RESOURCES = {
  // Core entities
  USERS: 'USERS',
  COMPANIES: 'COMPANIES',
  BRANCHES: 'BRANCHES',

  // Master data
  ITEMS: 'ITEMS',
  SUPPLIERS: 'SUPPLIERS',
  FORMULAS: 'FORMULAS',

  // Business process modules
  PURCHASE_REQUESTS: 'PURCHASE_REQUESTS',
  PURCHASE_ORDERS: 'PURCHASE_ORDERS',
  MATERIAL_REQUISITIONS: 'MATERIAL_REQUISITIONS',
  REQUEST_FORMS: 'REQUEST_FORMS',
  MANUFACTURING_LISTS: 'MANUFACTURING_LISTS',
  GOODS_RECEIPTS: 'GOODS_RECEIPTS',

  // Advanced features
  AI: 'AI',
  CHAT: 'CHAT',
} as const;

// Define Actions - Ordered by common operations first, then specialized actions
export const ACTIONS = {
  // Basic CRUD operations
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MANAGE: 'MANAGE',

  // Workflow actions
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',

  // User management actions
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_PERMISSIONS: 'MANAGE_PERMISSIONS',

  // Authentication actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REFRESH: 'REFRESH',
  REGISTER: 'REGISTER',

  // AI specific actions
  ACCESS_SUGGESTIONS: 'ACCESS_SUGGESTIONS',
  MANAGE_SUGGESTIONS: 'MANAGE_SUGGESTIONS',
  DEMAND_FORECASTING: 'DEMAND_FORECASTING',
  ANALYTICS: 'ANALYTICS',

  // Chat specific actions
  SEND_MESSAGE: 'SEND_MESSAGE',
  READ_MESSAGES: 'READ_MESSAGES',
  MANAGE_CONVERSATIONS: 'MANAGE_CONVERSATIONS',
} as const;

// Helper function to create permission strings
const createPermission = (resource: string, action: string): string => `${resource}:${action}`;

// === CORE ENTITY PERMISSIONS ===

// User Management Permissions
export const USER_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.USERS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.USERS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.USERS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.USERS, ACTIONS.DELETE),
  MANAGE_ROLES: createPermission(RESOURCES.USERS, ACTIONS.MANAGE_ROLES),
  MANAGE_PERMISSIONS: createPermission(RESOURCES.USERS, ACTIONS.MANAGE_PERMISSIONS),
} as const;

// Company Permissions
export const COMPANY_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.COMPANIES, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.COMPANIES, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.COMPANIES, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.COMPANIES, ACTIONS.DELETE),
  MANAGE: createPermission(RESOURCES.COMPANIES, ACTIONS.MANAGE),
} as const;

// Branch Permissions
export const BRANCH_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.BRANCHES, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.BRANCHES, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.BRANCHES, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.BRANCHES, ACTIONS.DELETE),
  MANAGE: createPermission(RESOURCES.BRANCHES, ACTIONS.MANAGE),
} as const;

// === MASTER DATA PERMISSIONS ===

// Item Permissions
export const ITEM_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.ITEMS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.ITEMS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.ITEMS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.ITEMS, ACTIONS.DELETE),
  MANAGE: createPermission(RESOURCES.ITEMS, ACTIONS.MANAGE),
} as const;

// Supplier Permissions
export const SUPPLIER_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.SUPPLIERS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.SUPPLIERS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.SUPPLIERS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.SUPPLIERS, ACTIONS.DELETE),
  MANAGE: createPermission(RESOURCES.SUPPLIERS, ACTIONS.MANAGE),
} as const;

// Formula Permissions
export const FORMULA_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.FORMULAS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.FORMULAS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.FORMULAS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.FORMULAS, ACTIONS.DELETE),
  MANAGE: createPermission(RESOURCES.FORMULAS, ACTIONS.MANAGE),
} as const;

// === BUSINESS PROCESS PERMISSIONS ===

// Purchase Request Permissions
export const PURCHASE_REQUEST_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.DELETE),
  SUBMIT: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.SUBMIT),
  APPROVE: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.APPROVE),
  REJECT: createPermission(RESOURCES.PURCHASE_REQUESTS, ACTIONS.REJECT),
} as const;

// Purchase Order Permissions
export const PURCHASE_ORDER_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.PURCHASE_ORDERS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.PURCHASE_ORDERS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.PURCHASE_ORDERS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.PURCHASE_ORDERS, ACTIONS.DELETE),
  APPROVE: createPermission(RESOURCES.PURCHASE_ORDERS, ACTIONS.APPROVE),
  REJECT: createPermission(RESOURCES.PURCHASE_ORDERS, ACTIONS.REJECT),
} as const;

// Material Requisition Permissions
export const MATERIAL_REQUISITION_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.MATERIAL_REQUISITIONS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.MATERIAL_REQUISITIONS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.MATERIAL_REQUISITIONS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.MATERIAL_REQUISITIONS, ACTIONS.DELETE),
  APPROVE: createPermission(RESOURCES.MATERIAL_REQUISITIONS, ACTIONS.APPROVE),
  REJECT: createPermission(RESOURCES.MATERIAL_REQUISITIONS, ACTIONS.REJECT),
} as const;

// Request Form Permissions
export const REQUEST_FORM_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.REQUEST_FORMS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.REQUEST_FORMS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.REQUEST_FORMS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.REQUEST_FORMS, ACTIONS.DELETE),
  APPROVE: createPermission(RESOURCES.REQUEST_FORMS, ACTIONS.APPROVE),
  REJECT: createPermission(RESOURCES.REQUEST_FORMS, ACTIONS.REJECT),
} as const;

// Manufacturing List Permissions
export const MANUFACTURING_LIST_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.MANUFACTURING_LISTS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.MANUFACTURING_LISTS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.MANUFACTURING_LISTS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.MANUFACTURING_LISTS, ACTIONS.DELETE),
  APPROVE: createPermission(RESOURCES.MANUFACTURING_LISTS, ACTIONS.APPROVE),
  REJECT: createPermission(RESOURCES.MANUFACTURING_LISTS, ACTIONS.REJECT),
} as const;

// Goods Receipt Permissions
export const GOODS_RECEIPT_PERMISSIONS = {
  CREATE: createPermission(RESOURCES.GOODS_RECEIPTS, ACTIONS.CREATE),
  READ: createPermission(RESOURCES.GOODS_RECEIPTS, ACTIONS.READ),
  UPDATE: createPermission(RESOURCES.GOODS_RECEIPTS, ACTIONS.UPDATE),
  DELETE: createPermission(RESOURCES.GOODS_RECEIPTS, ACTIONS.DELETE),
  APPROVE: createPermission(RESOURCES.GOODS_RECEIPTS, ACTIONS.APPROVE),
  REJECT: createPermission(RESOURCES.GOODS_RECEIPTS, ACTIONS.REJECT),
} as const;

// === ADVANCED FEATURE PERMISSIONS ===

// AI & Analytics Permissions
export const AI_PERMISSIONS = {
  ACCESS_SUGGESTIONS: createPermission(RESOURCES.AI, ACTIONS.ACCESS_SUGGESTIONS),
  MANAGE_SUGGESTIONS: createPermission(RESOURCES.AI, ACTIONS.MANAGE_SUGGESTIONS),
  DEMAND_FORECASTING: createPermission(RESOURCES.AI, ACTIONS.DEMAND_FORECASTING),
  ANALYTICS: createPermission(RESOURCES.AI, ACTIONS.ANALYTICS),
} as const;

// Chat Permissions
export const CHAT_PERMISSIONS = {
  SEND_MESSAGE: createPermission(RESOURCES.CHAT, ACTIONS.SEND_MESSAGE),
  READ_MESSAGES: createPermission(RESOURCES.CHAT, ACTIONS.READ_MESSAGES),
  MANAGE_CONVERSATIONS: createPermission(RESOURCES.CHAT, ACTIONS.MANAGE_CONVERSATIONS),
} as const;

// All permissions combined for easier access - Ordered by hierarchy
export const ALL_PERMISSIONS = {
  // Core entities
  USERS: USER_PERMISSIONS,
  COMPANIES: COMPANY_PERMISSIONS,
  BRANCHES: BRANCH_PERMISSIONS,

  // Master data
  ITEMS: ITEM_PERMISSIONS,
  SUPPLIERS: SUPPLIER_PERMISSIONS,
  FORMULAS: FORMULA_PERMISSIONS,

  // Business processes
  PURCHASE_REQUESTS: PURCHASE_REQUEST_PERMISSIONS,
  PURCHASE_ORDERS: PURCHASE_ORDER_PERMISSIONS,
  MATERIAL_REQUISITIONS: MATERIAL_REQUISITION_PERMISSIONS,
  REQUEST_FORMS: REQUEST_FORM_PERMISSIONS,
  MANUFACTURING_LISTS: MANUFACTURING_LIST_PERMISSIONS,
  GOODS_RECEIPTS: GOODS_RECEIPT_PERMISSIONS,

  // Advanced features
  AI: AI_PERMISSIONS,
  CHAT: CHAT_PERMISSIONS,
} as const;

// Type definitions for better TypeScript support - Ordered by hierarchy
export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

// Core entity permission types
export type UserPermission = (typeof USER_PERMISSIONS)[keyof typeof USER_PERMISSIONS];
export type CompanyPermission = (typeof COMPANY_PERMISSIONS)[keyof typeof COMPANY_PERMISSIONS];
export type BranchPermission = (typeof BRANCH_PERMISSIONS)[keyof typeof BRANCH_PERMISSIONS];

// Master data permission types
export type ItemPermission = (typeof ITEM_PERMISSIONS)[keyof typeof ITEM_PERMISSIONS];
export type SupplierPermission = (typeof SUPPLIER_PERMISSIONS)[keyof typeof SUPPLIER_PERMISSIONS];
export type FormulaPermission = (typeof FORMULA_PERMISSIONS)[keyof typeof FORMULA_PERMISSIONS];

// Business process permission types
export type PurchaseRequestPermission =
  (typeof PURCHASE_REQUEST_PERMISSIONS)[keyof typeof PURCHASE_REQUEST_PERMISSIONS];
export type PurchaseOrderPermission =
  (typeof PURCHASE_ORDER_PERMISSIONS)[keyof typeof PURCHASE_ORDER_PERMISSIONS];
export type MaterialRequisitionPermission =
  (typeof MATERIAL_REQUISITION_PERMISSIONS)[keyof typeof MATERIAL_REQUISITION_PERMISSIONS];
export type RequestFormPermission =
  (typeof REQUEST_FORM_PERMISSIONS)[keyof typeof REQUEST_FORM_PERMISSIONS];
export type ManufacturingListPermission =
  (typeof MANUFACTURING_LIST_PERMISSIONS)[keyof typeof MANUFACTURING_LIST_PERMISSIONS];
export type GoodsReceiptPermission =
  (typeof GOODS_RECEIPT_PERMISSIONS)[keyof typeof GOODS_RECEIPT_PERMISSIONS];

// Advanced feature permission types
export type AIPermission = (typeof AI_PERMISSIONS)[keyof typeof AI_PERMISSIONS];
export type ChatPermission = (typeof CHAT_PERMISSIONS)[keyof typeof CHAT_PERMISSIONS];

// Union type of all permissions
export type Permission =
  // Core entities
  | UserPermission
  | CompanyPermission
  | BranchPermission
  // Master data
  | ItemPermission
  | SupplierPermission
  | FormulaPermission
  // Business processes
  | PurchaseRequestPermission
  | PurchaseOrderPermission
  | MaterialRequisitionPermission
  | RequestFormPermission
  | ManufacturingListPermission
  | GoodsReceiptPermission
  // Advanced features
  | AIPermission
  | ChatPermission;

// Utility type to create permissions dynamically
export type CreatePermission<
  TResource extends Resource,
  TAction extends Action,
> = `${TResource}:${TAction}`;
