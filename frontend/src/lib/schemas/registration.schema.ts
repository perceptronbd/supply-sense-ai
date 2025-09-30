import { z } from 'zod';

// Base schema without refinement
const baseRegistrationSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters'),

  companyEmail: z
    .string()
    .min(1, 'Company email is required')
    .email('Please enter a valid company email address'),

  industry: z
    .string()
    .min(2, 'Industry must be at least 2 characters')
    .max(100, 'Industry must not exceed 100 characters'),

  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters'),

  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  confirmPassword: z.string().min(1, 'Please confirm your password'),

  taxId: z.string().max(50, 'Tax ID must not exceed 50 characters').optional(),

  businessAddress: z
    .string()
    .max(200, 'Business address must not exceed 200 characters')
    .optional(),

  contactPhone: z.string().max(20, 'Phone number must not exceed 20 characters').optional(),
});

// Full schema with refinement
export const registrationSchema = baseRegistrationSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Schema for individual field validation using base schema
export const registrationFieldSchemas = {
  companyName: baseRegistrationSchema.shape.companyName,
  companyEmail: baseRegistrationSchema.shape.companyEmail,
  firstName: baseRegistrationSchema.shape.firstName,
  lastName: baseRegistrationSchema.shape.lastName,
  email: baseRegistrationSchema.shape.email,
  password: baseRegistrationSchema.shape.password,
  confirmPassword: baseRegistrationSchema.shape.confirmPassword,
  industry: baseRegistrationSchema.shape.industry,
  taxId: baseRegistrationSchema.shape.taxId,
  businessAddress: baseRegistrationSchema.shape.businessAddress,
  contactPhone: baseRegistrationSchema.shape.contactPhone,
};
