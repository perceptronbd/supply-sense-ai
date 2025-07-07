import { z } from 'zod';

// Base field schemas for individual validation
export const supplierFieldSchemas = {
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name is too long'),
  code: z.string().min(1, 'Supplier code is required').max(20, 'Supplier code is too long'),
  contactPerson: z.string().max(100, 'Contact person name is too long').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  isActive: z.boolean(),
};

// Create supplier schema
export const createSupplierSchema = z.object({
  name: supplierFieldSchemas.name,
  code: supplierFieldSchemas.code,
  contactPerson: supplierFieldSchemas.contactPerson.or(z.literal('')),
  email: supplierFieldSchemas.email,
  phone: supplierFieldSchemas.phone.or(z.literal('')),
  address: supplierFieldSchemas.address.or(z.literal('')),
  isActive: supplierFieldSchemas.isActive,
});

// Update supplier schema (all fields optional except isActive)
export const updateSupplierSchema = z.object({
  name: supplierFieldSchemas.name.optional(),
  code: supplierFieldSchemas.code.optional(),
  contactPerson: supplierFieldSchemas.contactPerson.or(z.literal('')),
  email: supplierFieldSchemas.email,
  phone: supplierFieldSchemas.phone.or(z.literal('')),
  address: supplierFieldSchemas.address.or(z.literal('')),
  isActive: supplierFieldSchemas.isActive,
});

// TypeScript types inferred from schemas
export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
