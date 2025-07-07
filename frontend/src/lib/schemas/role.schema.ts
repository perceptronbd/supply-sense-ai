import { z } from 'zod';

// Role creation schema
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9\s_-]+$/,
      'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),

  description: z.string().max(255, 'Description must be less than 255 characters').optional(),

  permissionIds: z
    .array(z.string().uuid('Invalid permission ID'))
    .min(1, 'At least one permission must be selected')
    .max(50, 'Cannot assign more than 50 permissions'),

  isActive: z.boolean().optional().default(true),
});

// Role update schema (all fields optional)
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9\s_-]+$/,
      'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
    )
    .optional(),

  description: z.string().max(255, 'Description must be less than 255 characters').optional(),

  isActive: z.boolean().optional(),
});

// Permission assignment schema
export const assignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid('Invalid permission ID'))
    .min(1, 'At least one permission must be selected')
    .max(50, 'Cannot assign more than 50 permissions'),

  operation: z.enum(['replace', 'add', 'remove'], {
    required_error: 'Operation is required',
    invalid_type_error: 'Invalid operation type',
  }),
});

// Permission selection schema for UI
export const permissionSelectionSchema = z.object({
  selectedPermissions: z
    .array(z.string().uuid('Invalid permission ID'))
    .max(50, 'Cannot select more than 50 permissions'),

  selectedModules: z.array(z.string().min(1, 'Module name cannot be empty')).optional(),

  selectAll: z.boolean().optional().default(false),
});

// Role search/filter schema
export const roleSearchSchema = z.object({
  search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
  isActive: z.boolean().optional(),
  hasPermission: z.string().uuid('Invalid permission ID').optional(),
  minUserCount: z.number().int().min(0, 'Minimum user count cannot be negative').optional(),
  maxUserCount: z.number().int().min(0, 'Maximum user count cannot be negative').optional(),
});

// Bulk role operations schema
export const bulkRoleOperationSchema = z.object({
  roleIds: z
    .array(z.string().uuid('Invalid role ID'))
    .min(1, 'At least one role must be selected')
    .max(20, 'Cannot perform bulk operations on more than 20 roles'),

  operation: z.enum(['activate', 'deactivate', 'delete'], {
    required_error: 'Operation is required',
    invalid_type_error: 'Invalid operation type',
  }),
});

// Role comparison schema (for permission differences)
export const roleComparisonSchema = z.object({
  sourceRoleId: z.string().uuid('Invalid source role ID'),
  targetRoleId: z.string().uuid('Invalid target role ID'),
});

// Permission matrix schema (for Discord-style UI)
export const permissionMatrixSchema = z.object({
  roleId: z.string().uuid('Invalid role ID').optional(),
  permissions: z.record(
    z.string().min(1, 'Module name cannot be empty'),
    z.array(z.string().uuid('Invalid permission ID'))
  ),
  inheritFrom: z.string().uuid('Invalid role ID to inherit from').optional(),
});

// Type exports
export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsFormData = z.infer<typeof assignPermissionsSchema>;
export type PermissionSelectionFormData = z.infer<typeof permissionSelectionSchema>;
export type RoleSearchFormData = z.infer<typeof roleSearchSchema>;
export type BulkRoleOperationFormData = z.infer<typeof bulkRoleOperationSchema>;
export type RoleComparisonFormData = z.infer<typeof roleComparisonSchema>;
export type PermissionMatrixFormData = z.infer<typeof permissionMatrixSchema>;

// Validation helper functions
export const validateCreateRole = (data: unknown): CreateRoleFormData => {
  return createRoleSchema.parse(data);
};

export const validateUpdateRole = (data: unknown): UpdateRoleFormData => {
  return updateRoleSchema.parse(data);
};

export const validateAssignPermissions = (data: unknown): AssignPermissionsFormData => {
  return assignPermissionsSchema.parse(data);
};

export const validatePermissionSelection = (data: unknown): PermissionSelectionFormData => {
  return permissionSelectionSchema.parse(data);
};

export const validateRoleSearch = (data: unknown): RoleSearchFormData => {
  return roleSearchSchema.parse(data);
};

export const validateBulkRoleOperation = (data: unknown): BulkRoleOperationFormData => {
  return bulkRoleOperationSchema.parse(data);
};

export const validateRoleComparison = (data: unknown): RoleComparisonFormData => {
  return roleComparisonSchema.parse(data);
};

export const validatePermissionMatrix = (data: unknown): PermissionMatrixFormData => {
  return permissionMatrixSchema.parse(data);
};

// Helper function to validate role name availability
export const validateRoleNameUniqueness = (name: string, excludeId?: string) => {
  return z
    .object({
      name: z.string().min(1, 'Role name is required'),
      excludeId: z.string().uuid().optional(),
    })
    .parse({ name, excludeId });
};

// Helper function to validate permission dependencies
export const validatePermissionDependencies = (permissionIds: string[]) => {
  return z
    .array(z.string().uuid('Invalid permission ID'))
    .min(1, 'At least one permission must be selected')
    .parse(permissionIds);
};
