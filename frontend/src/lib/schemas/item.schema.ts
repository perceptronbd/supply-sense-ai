import { z } from 'zod';

// Item Schema for create/update operations
export const itemSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Item name is required.' })
    .max(100, { message: 'Item name cannot exceed 100 characters.' }),
  sku: z
    .string()
    .min(1, { message: 'SKU is required.' })
    .max(50, { message: 'SKU cannot exceed 50 characters.' })
    .regex(/^[A-Z0-9_-]+$/, {
      message: 'SKU can only contain uppercase letters, numbers, hyphens, and underscores.',
    }),
  description: z
    .string()
    .max(500, { message: 'Description cannot exceed 500 characters.' })
    .optional(),
  mainUnit: z
    .string()
    .min(1, { message: 'Main unit is required.' })
    .max(20, { message: 'Main unit cannot exceed 20 characters.' }),
  buyingUnit: z
    .string()
    .min(1, { message: 'Buying unit is required.' })
    .max(20, { message: 'Buying unit cannot exceed 20 characters.' }),
  transferUnit: z
    .string()
    .min(1, { message: 'Transfer unit is required.' })
    .max(20, { message: 'Transfer unit cannot exceed 20 characters.' }),
  usingUnit: z
    .string()
    .min(1, { message: 'Using unit is required.' })
    .max(20, { message: 'Using unit cannot exceed 20 characters.' }),
  buyingToMainRate: z
    .number({ message: 'Conversion rate must be a number.' })
    .positive({ message: 'Conversion rate must be greater than 0.' })
    .max(999999, { message: 'Conversion rate cannot exceed 999,999.' })
    .optional()
    .default(1),
  transferToMainRate: z
    .number({ message: 'Conversion rate must be a number.' })
    .positive({ message: 'Conversion rate must be greater than 0.' })
    .max(999999, { message: 'Conversion rate cannot exceed 999,999.' })
    .optional()
    .default(1),
  usingToMainRate: z
    .number({ message: 'Conversion rate must be a number.' })
    .positive({ message: 'Conversion rate must be greater than 0.' })
    .max(999999, { message: 'Conversion rate cannot exceed 999,999.' })
    .optional()
    .default(1),
  safetyStockLevel: z
    .number({ message: 'Safety stock level must be a number.' })
    .min(0, { message: 'Safety stock level cannot be negative.' })
    .max(999999, { message: 'Safety stock level cannot exceed 999,999.' })
    .optional()
    .default(0),
  reorderLevel: z
    .number({ message: 'Reorder level must be a number.' })
    .min(0, { message: 'Reorder level cannot be negative.' })
    .max(999999, { message: 'Reorder level cannot exceed 999,999.' })
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
});

// Create separate schema for create operations (all fields required)
export const createItemSchema = itemSchema;

// Update schema for edit operations (most fields optional)
export const updateItemSchema = itemSchema.partial().extend({
  // Keep some fields required even in updates if needed
  // For now, all fields are optional in updates
});

// Type inference
export type CreateItemFormData = z.infer<typeof createItemSchema>;
export type UpdateItemFormData = z.infer<typeof updateItemSchema>;

// Field-specific schemas for individual validation
export const itemFieldSchemas = {
  name: z.string().min(1, { message: 'Item name is required.' }).max(100),
  sku: z
    .string()
    .min(1, { message: 'SKU is required.' })
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, {
      message: 'SKU can only contain uppercase letters, numbers, hyphens, and underscores.',
    }),
  description: z.string().max(500).optional(),
  mainUnit: z.string().min(1, { message: 'Main unit is required.' }).max(20),
  buyingUnit: z.string().min(1, { message: 'Buying unit is required.' }).max(20),
  transferUnit: z.string().min(1, { message: 'Transfer unit is required.' }).max(20),
  usingUnit: z.string().min(1, { message: 'Using unit is required.' }).max(20),
  buyingToMainRate: z.number().positive().max(999999),
  transferToMainRate: z.number().positive().max(999999),
  usingToMainRate: z.number().positive().max(999999),
  safetyStockLevel: z.number().min(0).max(999999),
  reorderLevel: z.number().min(0).max(999999),
} as const;
