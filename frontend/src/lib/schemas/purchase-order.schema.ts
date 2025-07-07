import { z } from 'zod';

// Purchase Order Item Schema
export const purchaseOrderItemSchema = z.object({
  itemId: z.string().uuid({ message: 'Please select a valid item.' }),
  orderedQty: z
    .number({ message: 'Quantity must be a number.' })
    .positive({ message: 'Quantity must be greater than 0.' })
    .max(999999, { message: 'Quantity cannot exceed 999,999.' }),
  unitPrice: z
    .number({ message: 'Unit price must be a number.' })
    .positive({ message: 'Unit price must be greater than 0.' })
    .max(999999.99, { message: 'Unit price cannot exceed 999,999.99.' }),
  deliveryDate: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsedDate >= today;
    },
    { message: 'Delivery date must be today or in the future.' }
  ),
  remarks: z.string().max(500, { message: 'Remarks cannot exceed 500 characters.' }).optional(),
});

// Purchase Order Schema
export const purchaseOrderSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required.' })
    .max(100, { message: 'Title cannot exceed 100 characters.' }),
  prId: z.string().uuid().nullish(),
  supplierId: z.string().uuid({ message: 'Please select a valid supplier.' }),
  expectedDeliveryDate: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsedDate >= today;
    },
    { message: 'Expected delivery date must be today or in the future.' }
  ),
  paymentTerms: z
    .string()
    .max(100, { message: 'Payment terms cannot exceed 100 characters.' })
    .nullish(),
  deliveryTerms: z
    .string()
    .max(100, { message: 'Delivery terms cannot exceed 100 characters.' })
    .nullish(),
  branchId: z.string().uuid({ message: 'Please select a valid branch.' }),
  notes: z.string().max(1000, { message: 'Notes cannot exceed 1000 characters.' }).nullish(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, { message: 'At least one item is required.' })
    .max(50, { message: 'Cannot exceed 50 items per order.' }),
});

// Update Purchase Order Schema (all fields optional except items validation)
export const updatePurchaseOrderSchema = purchaseOrderSchema.partial().extend({
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, { message: 'At least one item is required.' })
    .max(50, { message: 'Cannot exceed 50 items per order.' })
    .optional(),
});

// TypeScript types inferred from schemas
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>;
export type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;

// Action state types for form handling
export type PurchaseOrderActionState = {
  form?: Partial<PurchaseOrderFormData>;
  errors?: {
    title?: string[];
    prId?: string[];
    supplierId?: string[];
    expectedDeliveryDate?: string[];
    paymentTerms?: string[];
    deliveryTerms?: string[];
    branchId?: string[];
    notes?: string[];
    items?: string[];
    _form?: string[];
  };
  success?: boolean;
  message?: string;
};

export type PurchaseOrderItemActionState = {
  form?: Partial<PurchaseOrderItemFormData>;
  errors?: {
    itemId?: string[];
    orderedQty?: string[];
    unitPrice?: string[];
    deliveryDate?: string[];
    remarks?: string[];
    _form?: string[];
  };
};
