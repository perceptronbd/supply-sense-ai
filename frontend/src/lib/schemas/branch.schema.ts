import { z } from 'zod';

// Base field schemas for individual validation
export const branchFieldSchemas = {
  name: z.string().min(1, 'Branch name is required').max(100, 'Branch name is too long'),
  code: z.string().min(1, 'Branch code is required').max(20, 'Branch code is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  address: z.string().max(255, 'Address is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  isActive: z.boolean(),
};

// Create branch schema
export const createBranchSchema = z.object({
  name: branchFieldSchemas.name,
  code: branchFieldSchemas.code,
  description: branchFieldSchemas.description.or(z.literal('')),
  address: branchFieldSchemas.address.or(z.literal('')),
  phone: branchFieldSchemas.phone.or(z.literal('')),
  email: branchFieldSchemas.email,
  isActive: branchFieldSchemas.isActive,
});

// Update branch schema (all fields optional except isActive)
export const updateBranchSchema = z.object({
  name: branchFieldSchemas.name.optional(),
  code: branchFieldSchemas.code.optional(),
  description: branchFieldSchemas.description.or(z.literal('')),
  address: branchFieldSchemas.address.or(z.literal('')),
  phone: branchFieldSchemas.phone.or(z.literal('')),
  email: branchFieldSchemas.email,
  isActive: branchFieldSchemas.isActive,
});

// TypeScript types inferred from schemas
export type CreateBranchFormData = z.infer<typeof createBranchSchema>;
export type UpdateBranchFormData = z.infer<typeof updateBranchSchema>;
