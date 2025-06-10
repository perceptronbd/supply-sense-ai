import { z } from 'zod';

// Purchase Request Item Schema
export const purchaseRequestItemSchema = z.object({
  itemId: z.string().uuid({ message: 'Please select a valid item.' }),
  requestedQty: z
    .number({ message: 'Quantity must be a number.' })
    .positive({ message: 'Quantity must be greater than 0.' })
    .max(999999, { message: 'Quantity cannot exceed 999,999.' }),
  estimatedPrice: z
    .number({ message: 'Price must be a number.' })
    .min(0, { message: 'Price cannot be negative.' })
    .max(999999.99, { message: 'Price cannot exceed 999,999.99.' })
    .optional(),
  requiredDate: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsedDate >= today;
    },
    { message: 'Required date must be today or in the future.' }
  ),
  remarks: z.string().max(500, { message: 'Remarks cannot exceed 500 characters.' }).optional(),
});

// Purchase Request Schema
export const purchaseRequestSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required.' })
    .max(100, { message: 'Title cannot exceed 100 characters.' }),
  description: z
    .string()
    .max(500, { message: 'Description cannot exceed 500 characters.' })
    .optional(),
  requiredDate: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsedDate >= today;
    },
    { message: 'Required date must be today or in the future.' }
  ),
  branchId: z.string().uuid({ message: 'Please select a valid branch.' }),
  prTemplateId: z.string().uuid().optional(),
  justification: z
    .string()
    .max(1000, { message: 'Justification cannot exceed 1000 characters.' })
    .optional(),
  items: z
    .array(purchaseRequestItemSchema)
    .min(1, { message: 'At least one item is required.' })
    .max(50, { message: 'Cannot exceed 50 items per request.' }),
});

// Update Purchase Request Schema (all fields optional except items validation)
export const updatePurchaseRequestSchema = purchaseRequestSchema.partial().extend({
  items: z
    .array(purchaseRequestItemSchema)
    .min(1, { message: 'At least one item is required.' })
    .max(50, { message: 'Cannot exceed 50 items per request.' })
    .optional(),
});

// TypeScript types inferred from schemas
export type PurchaseRequestFormData = z.infer<typeof purchaseRequestSchema>;
export type PurchaseRequestItemFormData = z.infer<typeof purchaseRequestItemSchema>;
export type UpdatePurchaseRequestFormData = z.infer<typeof updatePurchaseRequestSchema>;

// Action state types for form handling
export type PurchaseRequestActionState = {
  form?: Partial<PurchaseRequestFormData>;
  errors?: {
    title?: string[];
    description?: string[];
    requiredDate?: string[];
    branchId?: string[];
    prTemplateId?: string[];
    justification?: string[];
    items?: string[];
    _form?: string[];
  };
  success?: boolean;
  message?: string;
};

export type PurchaseRequestItemActionState = {
  form?: Partial<PurchaseRequestItemFormData>;
  errors?: {
    itemId?: string[];
    requestedQty?: string[];
    estimatedPrice?: string[];
    requiredDate?: string[];
    remarks?: string[];
    _form?: string[];
  };
};
