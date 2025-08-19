import { z } from 'zod';

const credentialSchema = z.object({
  host: z.string().optional(),
  port: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  sslEnabled: z.boolean().optional(),
});

export const dbConnectionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title must be less than 100 characters'),
    credential: credentialSchema.optional(),
    aboutYourBusiness: z
      .string()
      .min(10, 'Please provide at least 10 characters about your business'),
    connectionString: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If any credential field is filled, validate all required credential fields
    const cred = data.credential || {};
    const credFields = [cred.host, cred.port, cred.username, cred.password, cred.database];
    const anyCredFilled = credFields.some((v) => v && v.trim() !== '');
    if (anyCredFilled) {
      if (!cred.host || cred.host.trim() === '') {
        ctx.addIssue({
          path: ['credential', 'host'],
          message: 'Host is required if using credentials.',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!cred.port || !/^\d+$/.test(cred.port)) {
        ctx.addIssue({
          path: ['credential', 'port'],
          message: 'Port must be a number if using credentials.',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!cred.username || cred.username.trim() === '') {
        ctx.addIssue({
          path: ['credential', 'username'],
          message: 'Username is required if using credentials.',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!cred.password || cred.password.trim() === '') {
        ctx.addIssue({
          path: ['credential', 'password'],
          message: 'Password is required if using credentials.',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!cred.database || cred.database.trim() === '') {
        ctx.addIssue({
          path: ['credential', 'database'],
          message: 'Database name is required if using credentials.',
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

export type DbConnectionFormData = z.infer<typeof dbConnectionSchema>;

export const defaultDbConnectionValues: DbConnectionFormData = {
  title: '',
  credential: {
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
    sslEnabled: false,
  },
  aboutYourBusiness: '',
  connectionString: '',
};
