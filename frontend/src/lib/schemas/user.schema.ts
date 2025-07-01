import { z } from 'zod';

// User creation schema
export const createUserSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),

    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .max(255, 'Email must be less than 255 characters'),

    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),

    confirmPassword: z.string().min(1, 'Please confirm your password'),

    roleIds: z
      .array(z.string().uuid('Invalid role ID'))
      .min(1, 'At least one role must be selected')
      .max(10, 'Cannot assign more than 10 roles'),

    branchIds: z
      .array(z.string().uuid('Invalid branch ID'))
      .min(1, 'At least one branch must be selected')
      .max(20, 'Cannot assign more than 20 branches'),

    isActive: z.boolean().optional().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// User update schema (all fields optional except email/username uniqueness)
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .optional(),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .optional(),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),

  isActive: z.boolean().optional(),
});

// Role assignment schema
export const assignRolesSchema = z.object({
  roleIds: z
    .array(z.string().uuid('Invalid role ID'))
    .min(1, 'At least one role must be selected')
    .max(10, 'Cannot assign more than 10 roles'),

  operation: z.enum(['replace', 'add', 'remove'], {
    required_error: 'Operation is required',
    invalid_type_error: 'Invalid operation type',
  }),
});

// Branch assignment schema
export const assignBranchesSchema = z.object({
  branchIds: z
    .array(z.string().uuid('Invalid branch ID'))
    .min(1, 'At least one branch must be selected')
    .max(20, 'Cannot assign more than 20 branches'),

  operation: z.enum(['replace', 'add', 'remove'], {
    required_error: 'Operation is required',
    invalid_type_error: 'Invalid operation type',
  }),
});

// User search/filter schema
export const userSearchSchema = z.object({
  search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
  roleId: z.string().uuid('Invalid role ID').optional(),
  branchId: z.string().uuid('Invalid branch ID').optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1, 'Page must be at least 1').optional(),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional(),
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'username', 'createdAt', 'lastLogin'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeRoles: z.boolean().optional(),
  includeBranches: z.boolean().optional(),
});

// Type exports
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type AssignRolesFormData = z.infer<typeof assignRolesSchema>;
export type AssignBranchesFormData = z.infer<typeof assignBranchesSchema>;
export type UserSearchFormData = z.infer<typeof userSearchSchema>;

// Validation helper functions
export const validateCreateUser = (data: unknown): CreateUserFormData => {
  return createUserSchema.parse(data);
};

export const validateUpdateUser = (data: unknown): UpdateUserFormData => {
  return updateUserSchema.parse(data);
};

export const validateAssignRoles = (data: unknown): AssignRolesFormData => {
  return assignRolesSchema.parse(data);
};

export const validateAssignBranches = (data: unknown): AssignBranchesFormData => {
  return assignBranchesSchema.parse(data);
};

export const validateUserSearch = (data: unknown): UserSearchFormData => {
  return userSearchSchema.parse(data);
};
