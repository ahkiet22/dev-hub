import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .max(500)
  .optional()
  .nullable()
  .or(z.literal(''));

export const createPlatformSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Code must contain lowercase letters, numbers, and hyphens only'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(500).optional().nullable(),
  websiteUrl: optionalUrl,
  consoleUrl: optionalUrl,
  iconUrl: optionalUrl,
});

export const updatePlatformSchema = createPlatformSchema.omit({ code: true }).extend({
  isActive: z.boolean().optional(),
});

export type CreatePlatformInput = z.infer<typeof createPlatformSchema>;
export type UpdatePlatformInput = z.infer<typeof updatePlatformSchema>;
