import { METADATA_UPDATE_FREQUENCIES } from '@supplysense/constant';
import { z } from 'zod';

export const metadataFormSchema = z.object({
  friendlyLabel: z.string().min(1, 'Friendly label is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  updateFrequency: z.enum(METADATA_UPDATE_FREQUENCIES, {
    required_error: 'Update frequency is required',
  }),
  dataSensitivity: z.string().min(1, 'Data sensitivity is required'),
  sampleQuestions: z.array(z.string()).min(1, 'At least one sample question is required'),
});

export type TMetadataFormData = z.infer<typeof metadataFormSchema>;
