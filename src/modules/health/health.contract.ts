import { z } from 'zod';
import type { HealthStatus } from '@/modules/backend/backend.types';

export const dependencyCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().max(300).optional(),
});

export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  service: z.string().min(1).max(120),
  version: z.string().max(64).optional(),
  timestamp: z.string().datetime({ offset: true }),
  checks: z.record(z.string(), dependencyCheckSchema).optional(),
});

export type HealthResponsePayload = z.infer<typeof healthResponseSchema>;

export function classifyHealthResponse(
  httpStatus: number,
  bodyText: string
): {
  status: HealthStatus;
  payload: HealthResponsePayload | null;
  errorMessage: string | null;
} {
  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return {
      status: 'INVALID_RESPONSE',
      payload: null,
      errorMessage: `Invalid JSON response (HTTP ${httpStatus})`,
    };
  }

  const parsed = healthResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      status: 'INVALID_RESPONSE',
      payload: null,
      errorMessage: `Contract validation failed: ${parsed.error.issues[0]?.message ?? 'invalid schema'}`,
    };
  }

  const bodyStatus = parsed.data.status;

  if (httpStatus === 200 && bodyStatus === 'healthy') {
    return { status: 'HEALTHY', payload: parsed.data, errorMessage: null };
  }
  if (httpStatus === 200 && bodyStatus === 'degraded') {
    return { status: 'DEGRADED', payload: parsed.data, errorMessage: null };
  }
  if (httpStatus === 503 && bodyStatus === 'unhealthy') {
    return { status: 'UNHEALTHY', payload: parsed.data, errorMessage: null };
  }

  return {
    status: 'INVALID_RESPONSE',
    payload: parsed.data,
    errorMessage: `HTTP ${httpStatus} inconsistent with status "${bodyStatus}"`,
  };
}
