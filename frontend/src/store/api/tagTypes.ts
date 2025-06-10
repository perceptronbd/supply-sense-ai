/**
 * Centralized tag types for RTK Query cache management
 *
 * This file contains all tag types used across different API slices
 * to ensure consistency and avoid typos in cache invalidation
 */

export const TAG_TYPES = {
  // Authentication
  AUTH: 'Auth',

  // Core Entities
  USER_PROFILE: 'UserProfile',
  BRANCH: 'Branch',
  ITEM: 'Item',

  // Purchase Request Module
  PURCHASE_REQUEST: 'PurchaseRequest',
  PURCHASE_REQUEST_TEMPLATE: 'PurchaseRequestTemplate',

  // Purchase Order Module
  PURCHASE_ORDER: 'PurchaseOrder',
  PURCHASE_ORDER_TEMPLATE: 'PurchaseOrderTemplate',

  // Goods Receipt Module
  GOODS_RECEIPT: 'GoodsReceipt',

  // Inventory & Stock
  STOCK: 'Stock',
  INVENTORY: 'Inventory',

  // Suppliers & Vendors
  SUPPLIER: 'Supplier',
  VENDOR: 'Vendor',

  // Categories & Classifications
  CATEGORY: 'Category',
  PRODUCT_CATEGORY: 'ProductCategory',

  // Workflow & Approvals
  APPROVAL: 'Approval',
  WORKFLOW: 'Workflow',

  // Reports & Analytics
  REPORT: 'Report',
  ANALYTICS: 'Analytics',

  // AI & Recommendations
  AI_RECOMMENDATION: 'AiRecommendation',
  AI_FORECAST: 'AiForecast',
} as const;

export const TAG_TYPES_LIST = Object.values(TAG_TYPES);

export const TAG_TYPES_KEYS = Object.keys(TAG_TYPES) as (keyof typeof TAG_TYPES)[];

export type TagTypeKeys = (typeof TAG_TYPES_KEYS)[number];
export type TagTypes = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];

/**
 * Helper function to get multiple tag types
 * @param keys - Array of tag type keys
 * @returns Array of tag type values
 */
export function getTagTypes(keys: TagTypeKeys[]): TagTypes[] {
  return keys.map((key) => TAG_TYPES[key]);
}

/**
 * Common tag type combinations for different modules
 */
export const TAG_TYPE_GROUPS = {
  PURCHASE_REQUEST_MODULE: getTagTypes([
    'PURCHASE_REQUEST',
    'PURCHASE_REQUEST_TEMPLATE',
    'BRANCH',
    'ITEM',
  ]),

  PURCHASE_ORDER_MODULE: getTagTypes([
    'PURCHASE_ORDER',
    'PURCHASE_ORDER_TEMPLATE',
    'SUPPLIER',
    'ITEM',
    'BRANCH',
  ]),

  GOODS_RECEIPT_MODULE: getTagTypes(['GOODS_RECEIPT', 'PURCHASE_ORDER', 'ITEM', 'STOCK', 'BRANCH']),

  INVENTORY_MODULE: getTagTypes(['STOCK', 'INVENTORY', 'ITEM', 'BRANCH', 'CATEGORY']),

  AUTH_MODULE: getTagTypes(['AUTH', 'USER_PROFILE']),
} as const;
