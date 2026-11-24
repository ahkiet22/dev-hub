import type { HealthStatus } from '@/modules/backend/backend.types';
import type { HealthResponsePayload } from './health.contract';

export interface BackendHealthCheck {
  id: string;
  backendId: string;
  status: HealthStatus;
  httpStatusCode: number | null;
  responseTimeMs: number | null;
  responseBody: HealthResponsePayload | null;
  errorMessage: string | null;
  checkedAt: Date;
}
