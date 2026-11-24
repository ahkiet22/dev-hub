import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { HealthStatus, ProjectBackend } from './backend.types';

interface BackendRow {
  id: string;
  project_id: string;
  project_name?: string;
  deployment_platform_id: string | null;
  platform_name?: string | null;
  name: string;
  description: string | null;
  repository_url: string | null;
  base_url: string | null;
  health_url: string;
  deployment_console_url: string | null;
  health_status: HealthStatus;
  check_interval_seconds: number;
  timeout_ms: number;
  last_checked_at: Date | null;
  last_healthy_at: Date | null;
  response_time_ms: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: BackendRow): ProjectBackend {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    deploymentPlatformId: row.deployment_platform_id,
    platformName: row.platform_name ?? null,
    name: row.name,
    description: row.description,
    repositoryUrl: row.repository_url,
    baseUrl: row.base_url,
    healthUrl: row.health_url,
    deploymentConsoleUrl: row.deployment_console_url,
    healthStatus: row.health_status,
    checkIntervalSeconds: row.check_interval_seconds,
    timeoutMs: row.timeout_ms,
    lastCheckedAt: row.last_checked_at,
    lastHealthyAt: row.last_healthy_at,
    responseTimeMs: row.response_time_ms,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const backendRepository = {
  async listByProjectAndUser(
    projectId: string,
    userId: string,
    client?: QueryClient
  ): Promise<ProjectBackend[]> {
    const res = await query<BackendRow>(
      `SELECT
         b.id, b.project_id, p.name AS project_name,
         b.deployment_platform_id, dp.name AS platform_name,
         b.name, b.description, b.repository_url, b.base_url, b.health_url,
         b.deployment_console_url, b.health_status, b.check_interval_seconds,
         b.timeout_ms, b.last_checked_at, b.last_healthy_at, b.response_time_ms,
         b.is_active, b.created_at, b.updated_at
       FROM "dev-hub".project_backends b
       JOIN "dev-hub".projects p ON p.id = b.project_id
       LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = b.deployment_platform_id
       WHERE b.project_id = $1
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND b.deleted_at IS NULL
       ORDER BY b.created_at DESC`,
      [projectId, userId],
      client
    );
    return res.rows.map(mapRow);
  },

  async listByUser(userId: string, client?: QueryClient): Promise<ProjectBackend[]> {
    const res = await query<BackendRow>(
      `SELECT
         b.id, b.project_id, p.name AS project_name,
         b.deployment_platform_id, dp.name AS platform_name,
         b.name, b.description, b.repository_url, b.base_url, b.health_url,
         b.deployment_console_url, b.health_status, b.check_interval_seconds,
         b.timeout_ms, b.last_checked_at, b.last_healthy_at, b.response_time_ms,
         b.is_active, b.created_at, b.updated_at
       FROM "dev-hub".project_backends b
       JOIN "dev-hub".projects p ON p.id = b.project_id
       LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = b.deployment_platform_id
       WHERE p.user_id = $1
         AND p.deleted_at IS NULL
         AND b.deleted_at IS NULL
       ORDER BY b.updated_at DESC`,
      [userId],
      client
    );
    return res.rows.map(mapRow);
  },

  async findByIdAndUser(
    id: string,
    userId: string,
    client?: QueryClient
  ): Promise<ProjectBackend | null> {
    const row = await queryOne<BackendRow>(
      `SELECT
         b.id, b.project_id, p.name AS project_name,
         b.deployment_platform_id, dp.name AS platform_name,
         b.name, b.description, b.repository_url, b.base_url, b.health_url,
         b.deployment_console_url, b.health_status, b.check_interval_seconds,
         b.timeout_ms, b.last_checked_at, b.last_healthy_at, b.response_time_ms,
         b.is_active, b.created_at, b.updated_at
       FROM "dev-hub".project_backends b
       JOIN "dev-hub".projects p ON p.id = b.project_id
       LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = b.deployment_platform_id
       WHERE b.id = $1
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND b.deleted_at IS NULL
       LIMIT 1`,
      [id, userId],
      client
    );
    return row ? mapRow(row) : null;
  },

  async create(
    input: {
      projectId: string;
      deploymentPlatformId: string | null;
      name: string;
      description: string | null;
      repositoryUrl: string | null;
      baseUrl: string | null;
      healthUrl: string;
      deploymentConsoleUrl: string | null;
      checkIntervalSeconds: number;
      timeoutMs: number;
    },
    client?: QueryClient
  ): Promise<ProjectBackend> {
    const row = await queryOne<BackendRow>(
      `INSERT INTO "dev-hub".project_backends (
         project_id, deployment_platform_id, name, description, repository_url,
         base_url, health_url, deployment_console_url, check_interval_seconds, timeout_ms
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, project_id, deployment_platform_id, name, description,
                 repository_url, base_url, health_url, deployment_console_url,
                 health_status, check_interval_seconds, timeout_ms,
                 last_checked_at, last_healthy_at, response_time_ms,
                 is_active, created_at, updated_at`,
      [
        input.projectId,
        input.deploymentPlatformId,
        input.name,
        input.description,
        input.repositoryUrl,
        input.baseUrl,
        input.healthUrl,
        input.deploymentConsoleUrl,
        input.checkIntervalSeconds,
        input.timeoutMs,
      ],
      client
    );
    if (!row) throw new Error('Failed to create backend');
    return mapRow(row);
  },

  async update(
    id: string,
    userId: string,
    input: {
      deploymentPlatformId: string | null;
      name: string;
      description: string | null;
      repositoryUrl: string | null;
      baseUrl: string | null;
      healthUrl: string;
      deploymentConsoleUrl: string | null;
      checkIntervalSeconds: number;
      timeoutMs: number;
      isActive?: boolean;
    },
    client?: QueryClient
  ): Promise<ProjectBackend | null> {
    const row = await queryOne<BackendRow>(
      `UPDATE "dev-hub".project_backends b
       SET deployment_platform_id = $3,
           name = $4,
           description = $5,
           repository_url = $6,
           base_url = $7,
           health_url = $8,
           deployment_console_url = $9,
           check_interval_seconds = $10,
           timeout_ms = $11,
           is_active = COALESCE($12, b.is_active),
           updated_at = now()
       FROM "dev-hub".projects p
       WHERE b.id = $1
         AND b.project_id = p.id
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND b.deleted_at IS NULL
       RETURNING b.id, b.project_id, b.deployment_platform_id, b.name, b.description,
                 b.repository_url, b.base_url, b.health_url, b.deployment_console_url,
                 b.health_status, b.check_interval_seconds, b.timeout_ms,
                 b.last_checked_at, b.last_healthy_at, b.response_time_ms,
                 b.is_active, b.created_at, b.updated_at`,
      [
        id,
        userId,
        input.deploymentPlatformId,
        input.name,
        input.description,
        input.repositoryUrl,
        input.baseUrl,
        input.healthUrl,
        input.deploymentConsoleUrl,
        input.checkIntervalSeconds,
        input.timeoutMs,
        input.isActive ?? null,
      ],
      client
    );
    return row ? mapRow(row) : null;
  },

  async toggleActive(
    id: string,
    userId: string,
    isActive: boolean,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".project_backends b
       SET is_active = $3, updated_at = now()
       FROM "dev-hub".projects p
       WHERE b.id = $1
         AND b.project_id = p.id
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND b.deleted_at IS NULL`,
      [id, userId, isActive],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },

  async softDelete(
    id: string,
    userId: string,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".project_backends b
       SET deleted_at = now(), updated_at = now()
       FROM "dev-hub".projects p
       WHERE b.id = $1
         AND b.project_id = p.id
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND b.deleted_at IS NULL`,
      [id, userId],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },
};
