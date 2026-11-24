import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DATABASE_HOST: z
    .string()
    .optional()
    .transform((v) => v?.trim() || 'localhost'),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_USER: z
    .string()
    .optional()
    .transform((v) => v?.trim() || 'admin'),
  DATABASE_PASSWORD: z
    .string()
    .optional()
    .transform((v) => v ?? 'admin'),
  DATABASE_NAME: z
    .string()
    .optional()
    .transform((v) => v?.trim() || 'postgres'),
  DATABASE_SSLMODE: z
    .enum(['disable', 'require', 'verify-ca', 'verify-full'])
    .default('disable'),
  DATABASE_SCHEMA: z
    .string()
    .optional()
    .transform((v) => v?.trim() || 'dev-hub')
    .refine((v) => /^[a-zA-Z0-9_-]+$/.test(v), 'Invalid DATABASE_SCHEMA'),
  APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CRON_SECRET: z.string().optional(),
  TRUSTED_PRIVATE_NETWORKS: z.string().optional(),
  HEALTH_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  ALLOWED_REMOTE_ORIGINS: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(options?: { reload?: boolean }): AppEnv {
  if (cachedEnv && !options?.reload) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
