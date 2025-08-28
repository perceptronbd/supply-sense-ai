import { z } from 'zod';

const credentialSchema = z.object({
  host: z.string().optional(),
  port: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  sslEnabled: z.boolean().optional(),
});

// Validation helper functions
const validateCredentialField = (
  value: string | undefined,
  fieldName: string,
  ctx: z.RefinementCtx,
  path: string[]
) => {
  if (!value || value.trim() === '') {
    ctx.addIssue({
      path,
      message: `${fieldName} is required if using credentials.`,
      code: z.ZodIssueCode.custom,
    });
  }
};

const validatePortField = (port: string | undefined, ctx: z.RefinementCtx) => {
  if (!port || !/^\d+$/.test(port)) {
    ctx.addIssue({
      path: ['credential', 'port'],
      message: 'Port must be a number if using credentials.',
      code: z.ZodIssueCode.custom,
    });
  }
};

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

    if (!anyCredFilled) return;

    validateCredentialField(cred.host, 'Host', ctx, ['credential', 'host']);
    validatePortField(cred.port, ctx);
    validateCredentialField(cred.username, 'Username', ctx, ['credential', 'username']);
    validateCredentialField(cred.password, 'Password', ctx, ['credential', 'password']);
    validateCredentialField(cred.database, 'Database name', ctx, ['credential', 'database']);
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
