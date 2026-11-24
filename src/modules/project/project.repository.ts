import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { Project, ProjectStatus, ProjectWithSummary } from './project.types';

interface ProjectRow {
  id: string;
  user_id: string;
  code: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  status: ProjectStatus;
  created_at: Date;
  updated_at: Date;
}

interface ProjectSummaryRow extends ProjectRow {
  backend_count: string;
  frontend_count: string;
  healthy_backends: string;
  degraded_backends: string;
  unhealthy_backends: string;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    name: row.name,
    description: row.description,
    iconUrl: row.icon_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const projectRepository = {
  async listByUser(
    userId: string,
    filters?: { search?: string; status?: ProjectStatus },
    client?: QueryClient
  ): Promise<ProjectWithSummary[]> {
    const params: unknown[] = [userId];
    const conditions: string[] = ['p.user_id = $1', 'p.deleted_at IS NULL'];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (filters?.search?.trim()) {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(
        `(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length})`
      );
    }

    const res = await query<ProjectSummaryRow>(
      `SELECT
         p.id, p.user_id, p.code, p.name, p.description, p.icon_url, p.status,
         p.created_at, p.updated_at,
         COALESCE(b.total, 0) AS backend_count,
         COALESCE(f.total, 0) AS frontend_count,
         COALESCE(b.healthy, 0) AS healthy_backends,
         COALESCE(b.degraded, 0) AS degraded_backends,
         COALESCE(b.unhealthy, 0) AS unhealthy_backends
       FROM "dev-hub".projects p
       LEFT JOIN (
         SELECT
           project_id,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE health_status = 'HEALTHY') AS healthy,
           COUNT(*) FILTER (WHERE health_status = 'DEGRADED') AS degraded,
           COUNT(*) FILTER (WHERE health_status IN ('UNHEALTHY', 'UNREACHABLE', 'INVALID_RESPONSE')) AS unhealthy
         FROM "dev-hub".project_backends
         WHERE deleted_at IS NULL
         GROUP BY project_id
       ) b ON b.project_id = p.id
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS total
         FROM "dev-hub".project_frontends
         WHERE deleted_at IS NULL
         GROUP BY project_id
       ) f ON f.project_id = p.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.updated_at DESC`,
      params,
      client
    );

    return res.rows.map((row) => ({
      ...mapRow(row),
      backendCount: Number(row.backend_count),
      frontendCount: Number(row.frontend_count),
      healthyBackends: Number(row.healthy_backends),
      degradedBackends: Number(row.degraded_backends),
      unhealthyBackends: Number(row.unhealthy_backends),
    }));
  },

  async findByIdAndUser(
    id: string,
    userId: string,
    client?: QueryClient
  ): Promise<Project | null> {
    const row = await queryOne<ProjectRow>(
      `SELECT id, user_id, code, name, description, icon_url, status, created_at, updated_at
       FROM "dev-hub".projects
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [id, userId],
      client
    );
    return row ? mapRow(row) : null;
  },

  async findByCodeAndUser(
    code: string,
    userId: string,
    excludeId?: string,
    client?: QueryClient
  ): Promise<Project | null> {
    const params: unknown[] = [userId, code];
    let sql = `SELECT id, user_id, code, name, description, icon_url, status, created_at, updated_at
               FROM "dev-hub".projects
               WHERE user_id = $1 AND code = $2 AND deleted_at IS NULL`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $3`;
    }
    sql += ' LIMIT 1';
    const row = await queryOne<ProjectRow>(sql, params, client);
    return row ? mapRow(row) : null;
  },

  async create(
    input: {
      userId: string;
      code: string;
      name: string;
      description: string | null;
      iconUrl: string | null;
      status: ProjectStatus;
    },
    client?: QueryClient
  ): Promise<Project> {
    const row = await queryOne<ProjectRow>(
      `INSERT INTO "dev-hub".projects (user_id, code, name, description, icon_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, code, name, description, icon_url, status, created_at, updated_at`,
      [
        input.userId,
        input.code,
        input.name,
        input.description,
        input.iconUrl,
        input.status,
      ],
      client
    );
    if (!row) throw new Error('Failed to create project');
    return mapRow(row);
  },

  async update(
    id: string,
    userId: string,
    input: {
      code: string;
      name: string;
      description: string | null;
      iconUrl: string | null;
      status: ProjectStatus;
    },
    client?: QueryClient
  ): Promise<Project | null> {
    const row = await queryOne<ProjectRow>(
      `UPDATE "dev-hub".projects
       SET code = $3, name = $4, description = $5, icon_url = $6, status = $7, updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, user_id, code, name, description, icon_url, status, created_at, updated_at`,
      [
        id,
        userId,
        input.code,
        input.name,
        input.description,
        input.iconUrl,
        input.status,
      ],
      client
    );
    return row ? mapRow(row) : null;
  },

  async setStatus(
    id: string,
    userId: string,
    status: ProjectStatus,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".projects
       SET status = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId, status],
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
      `UPDATE "dev-hub".projects
       SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },
};
