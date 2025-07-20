import { z } from 'zod';

export const dbConnectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  host: z.string().min(1, 'Host is required'),
  port: z
    .string()
    .regex(/^\d+$/, 'Port must be a number')
    .refine((val) => {
      const num = Number(val);
      return num >= 1 && num <= 65535;
    }, 'Port must be between 1 and 65535'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  database: z.string().min(1, 'Database name is required'),
  ssl: z.boolean(),
  aboutYourBusiness: z
    .string()
    .min(10, 'Please provide at least 10 characters about your business'),
});

export type DbConnectionFormData = z.infer<typeof dbConnectionSchema>;
