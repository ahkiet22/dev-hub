import { z } from 'zod';

export const projectStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

export const createProjectSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Project code must be at least 2 characters')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Code must contain lowercase letters, numbers, and hyphens only'),
  name: z.string().trim().min(1, 'Project name is required').max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  iconUrl: z
    .string()
    .trim()
    .url('Icon URL must be valid')
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('')),
  status: projectStatusSchema.default('ACTIVE'),
});

export const updateProjectSchema = createProjectSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
