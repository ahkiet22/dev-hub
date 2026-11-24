export type HealthStatus =
  | 'UNKNOWN'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'UNREACHABLE'
  | 'INVALID_RESPONSE';

export interface ProjectBackend {
  id: string;
  projectId: string;
  projectName?: string;
  deploymentPlatformId: string | null;
  platformName?: string | null;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  baseUrl: string | null;
  healthUrl: string;
  deploymentConsoleUrl: string | null;
  healthStatus: HealthStatus;
  checkIntervalSeconds: number;
  timeoutMs: number;
  lastCheckedAt: Date | null;
  lastHealthyAt: Date | null;
  responseTimeMs: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
