import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .max(500)
  .optional()
  .nullable()
  .or(z.literal(''));

export const createBackendSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  deploymentPlatformId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal('')),
  name: z.string().trim().min(1, 'Backend name is required').max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  repositoryUrl: optionalUrl,
  baseUrl: optionalUrl,
  healthUrl: z
    .string()
    .trim()
    .url('Health URL must be a valid HTTP/HTTPS URL')
    .max(500)
    .refine(
      (u) => u.startsWith('http://') || u.startsWith('https://'),
      'Health URL must use http:// or https://'
    ),
  deploymentConsoleUrl: optionalUrl,
  checkIntervalSeconds: z.coerce.number().int().min(10).max(86400).default(60),
  timeoutMs: z.coerce.number().int().min(500).max(30000).default(5000),
});

export const updateBackendSchema = createBackendSchema.omit({ projectId: true }).extend({
  isActive: z.boolean().optional(),
});

export type CreateBackendInput = z.infer<typeof createBackendSchema>;
export type UpdateBackendInput = z.infer<typeof updateBackendSchema>;
