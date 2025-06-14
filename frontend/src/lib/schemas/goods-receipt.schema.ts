import { z } from 'zod';

// Goods Receipt Item Schema
export const grItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID format'),
  orderedQty: z.number().positive('Ordered quantity must be positive'),
  receivedQty: z.number().positive('Received quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive').optional(),
  qualityNotes: z.string().optional(),
});

// Create Goods Receipt Schema
export const createGoodsReceiptSchema = z.object({
  poId: z.string().uuid('Invalid purchase order ID format').optional(),
  mrId: z.string().uuid('Invalid material requisition ID format').optional(),
  receiptDate: z.string().datetime('Invalid receipt date format').optional(),
  documentNumber: z.string().min(1, 'Document number is required').optional(),
  branchId: z.string().uuid('Invalid branch ID format'),
  remarks: z.string().optional(),
  items: z.array(grItemSchema).min(1, 'At least one item is required'),
});

// Update Goods Receipt Schema
export const updateGoodsReceiptSchema = z.object({
  receiptDate: z.string().datetime('Invalid receipt date format').optional(),
  documentNumber: z.string().min(1, 'Document number cannot be empty').optional(),
  remarks: z.string().optional(),
  items: z.array(grItemSchema).min(1, 'At least one item is required').optional(),
});

// Type exports
export type GRItemFormData = z.infer<typeof grItemSchema>;
export type CreateGoodsReceiptFormData = z.infer<typeof createGoodsReceiptSchema>;
export type UpdateGoodsReceiptFormData = z.infer<typeof updateGoodsReceiptSchema>;
