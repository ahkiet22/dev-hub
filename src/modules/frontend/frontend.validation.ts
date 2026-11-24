import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .max(500)
  .optional()
  .nullable()
  .or(z.literal(''));

export const integrationTypeSchema = z.enum([
  'MODULE_FEDERATION',
  'IFRAME',
  'EXTERNAL',
]);

const baseFrontendSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  deploymentPlatformId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal('')),
  name: z.string().trim().min(1, 'Frontend name is required').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug must be at least 2 characters')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().max(1000).optional().nullable(),
  repositoryUrl: optionalUrl,
  applicationUrl: optionalUrl,
  deploymentConsoleUrl: optionalUrl,
  integrationType: integrationTypeSchema.default('MODULE_FEDERATION'),
  entryUrl: optionalUrl,
  remoteName: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  exposedModule: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  iconUrl: optionalUrl,
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

function validateIntegrationConfig(
  data: z.infer<typeof baseFrontendSchema>,
  ctx: z.RefinementCtx
) {
  if (data.integrationType === 'MODULE_FEDERATION') {
    if (!data.entryUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entryUrl'],
        message: 'Entry URL (mf-manifest.json) is required for MODULE_FEDERATION',
      });
    }
    if (!data.remoteName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['remoteName'],
        message: 'Remote Name is required for MODULE_FEDERATION',
      });
    }
    if (!data.exposedModule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exposedModule'],
        message: 'Exposed Module (e.g. ./App) is required for MODULE_FEDERATION',
      });
    }
  } else {
    if (!data.applicationUrl && !data.entryUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationUrl'],
        message: 'Application URL is required for IFRAME or EXTERNAL integration',
      });
    }
  }
}

export const createFrontendSchema = baseFrontendSchema.superRefine(
  validateIntegrationConfig
);

export type CreateFrontendInput = z.infer<typeof createFrontendSchema>;
