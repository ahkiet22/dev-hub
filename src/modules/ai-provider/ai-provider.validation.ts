import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .max(500)
  .optional()
  .nullable()
  .or(z.literal(''));

export const createAiProviderSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Code must contain lowercase letters, numbers, and hyphens only'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  websiteUrl: z.string().trim().url('Website URL must be valid').max(500),
  logoUrl: optionalUrl,
  description: z.string().trim().max(500).optional().nullable(),
});

export type CreateAiProviderInput = z.infer<typeof createAiProviderSchema>;
