import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { HealthStatus } from '@/modules/backend/backend.types';
import type { HealthResponsePayload } from './health.contract';
import type { BackendHealthCheck } from './health.types';

interface HealthCheckRow {
  id: string;
  backend_id: string;
  status: HealthStatus;
  http_status_code: number | null;
  response_time_ms: number | null;
  response_body: HealthResponsePayload | null;
  error_message: string | null;
  checked_at: Date;
}

export interface DueBackendTarget {
  id: string;
  healthUrl: string;
  timeoutMs: number;
}

function mapRow(row: HealthCheckRow): BackendHealthCheck {
  return {
    id: row.id,
    backendId: row.backend_id,
    status: row.status,
    httpStatusCode: row.http_status_code,
    responseTimeMs: row.response_time_ms,
    responseBody: row.response_body,
    errorMessage: row.error_message,
    checkedAt: row.checked_at,
  };
}

export const healthRepository = {
  async findDueBackends(limit = 20, client?: QueryClient): Promise<DueBackendTarget[]> {
    const res = await query<{ id: string; health_url: string; timeout_ms: number }>(
      `SELECT b.id, b.health_url, b.timeout_ms
       FROM "dev-hub".project_backends b
       JOIN "dev-hub".projects p ON p.id = b.project_id
       WHERE b.deleted_at IS NULL
         AND p.deleted_at IS NULL
         AND b.is_active = true
         AND p.status = 'ACTIVE'
         AND (
           b.last_checked_at IS NULL
           OR b.last_checked_at + (b.check_interval_seconds * interval '1 second') <= now()
         )
       ORDER BY b.last_checked_at ASC NULLS FIRST
       LIMIT $1`,
      [limit],
      client
    );
    return res.rows.map((r) => ({
      id: r.id,
      healthUrl: r.health_url,
      timeoutMs: r.timeout_ms,
    }));
  },

  async recordCheckResult(
    params: {
      backendId: string;
      status: HealthStatus;
      httpStatusCode: number | null;
      responseTimeMs: number | null;
      responseBody: HealthResponsePayload | null;
      errorMessage: string | null;
    },
    client?: QueryClient
  ): Promise<BackendHealthCheck> {
    const row = await queryOne<HealthCheckRow>(
      `INSERT INTO "dev-hub".backend_health_checks
         (backend_id, status, http_status_code, response_time_ms, response_body, error_message)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, backend_id, status, http_status_code, response_time_ms,
                 response_body, error_message, checked_at`,
      [
        params.backendId,
        params.status,
        params.httpStatusCode,
        params.responseTimeMs,
        params.responseBody ? JSON.stringify(params.responseBody) : null,
        params.errorMessage,
      ],
      client
    );
    if (!row) throw new Error('Failed to insert health check');

    await query(
      `UPDATE "dev-hub".project_backends
       SET health_status = $2,
           response_time_ms = $3,
           last_checked_at = $4,
           last_healthy_at = CASE WHEN $2 = 'HEALTHY' THEN $4 ELSE last_healthy_at END,
           updated_at = now()
       WHERE id = $1`,
      [params.backendId, params.status, params.responseTimeMs, row.checked_at],
      client
    );

    return mapRow(row);
  },

  async listByBackendAndUser(
    backendId: string,
    userId: string,
    limit = 50,
    client?: QueryClient
  ): Promise<BackendHealthCheck[]> {
    const res = await query<HealthCheckRow>(
      `SELECT
         c.id, c.backend_id, c.status, c.http_status_code,
         c.response_time_ms, c.response_body, c.error_message, c.checked_at
       FROM "dev-hub".backend_health_checks c
       JOIN "dev-hub".project_backends b ON b.id = c.backend_id
       JOIN "dev-hub".projects p ON p.id = b.project_id
       WHERE c.backend_id = $1
         AND p.user_id = $2
         AND b.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY c.checked_at DESC
       LIMIT $3`,
      [backendId, userId, limit],
      client
    );
    return res.rows.map(mapRow);
  },

  async deleteOlderThanDays(days: number, client?: QueryClient): Promise<number> {
    const res = await query(
      `DELETE FROM "dev-hub".backend_health_checks
       WHERE checked_at < now() - ($1 * interval '1 day')`,
      [days],
      client
    );
    return res.rowCount ?? 0;
  },
};
