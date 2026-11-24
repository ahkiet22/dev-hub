import 'server-only';
import { query, queryOne } from '@/platform/database/client';
import type { HealthStatus } from '@/modules/backend/backend.types';
import type { ProjectStatus } from '@/modules/project/project.types';

export interface DashboardOverview {
  counts: {
    totalProjects: number;
    activeProjects: number;
    totalBackends: number;
    healthyBackends: number;
    degradedBackends: number;
    unhealthyBackends: number;
    unreachableBackends: number;
    totalFrontends: number;
    totalAiProviders: number;
    totalAiAccounts: number;
  };
  recentBackends: Array<{
    id: string;
    name: string;
    projectName: string;
    healthStatus: HealthStatus;
    responseTimeMs: number | null;
    lastCheckedAt: Date | null;
  }>;
  recentProjects: Array<{
    id: string;
    code: string;
    name: string;
    status: ProjectStatus;
    updatedAt: Date;
  }>;
  quickApps: Array<{
    id: string;
    projectId: string;
    slug: string;
    name: string;
    projectName: string;
  }>;
  platformDistribution: Array<{
    name: string;
    count: number;
  }>;
}

export const dashboardRepository = {
  async getOverview(userId: string): Promise<DashboardOverview> {
    const [countsRow, recentBackendsRes, recentProjectsRes, quickAppsRes, platformRes] =
      await Promise.all([
        queryOne<{
          total_projects: string;
          active_projects: string;
          total_backends: string;
          healthy_backends: string;
          degraded_backends: string;
          unhealthy_backends: string;
          unreachable_backends: string;
          total_frontends: string;
          total_ai_providers: string;
          total_ai_accounts: string;
        }>(
          `SELECT
             (SELECT COUNT(*) FROM "dev-hub".projects WHERE user_id = $1 AND deleted_at IS NULL) AS total_projects,
             (SELECT COUNT(*) FROM "dev-hub".projects WHERE user_id = $1 AND deleted_at IS NULL AND status = 'ACTIVE') AS active_projects,
             (SELECT COUNT(*) FROM "dev-hub".project_backends b JOIN "dev-hub".projects p ON p.id = b.project_id WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL) AS total_backends,
             (SELECT COUNT(*) FROM "dev-hub".project_backends b JOIN "dev-hub".projects p ON p.id = b.project_id WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL AND b.health_status = 'HEALTHY') AS healthy_backends,
             (SELECT COUNT(*) FROM "dev-hub".project_backends b JOIN "dev-hub".projects p ON p.id = b.project_id WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL AND b.health_status = 'DEGRADED') AS degraded_backends,
             (SELECT COUNT(*) FROM "dev-hub".project_backends b JOIN "dev-hub".projects p ON p.id = b.project_id WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL AND b.health_status = 'UNHEALTHY') AS unhealthy_backends,
             (SELECT COUNT(*) FROM "dev-hub".project_backends b JOIN "dev-hub".projects p ON p.id = b.project_id WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL AND b.health_status IN ('UNREACHABLE', 'INVALID_RESPONSE')) AS unreachable_backends,
             (SELECT COUNT(*) FROM "dev-hub".project_frontends f JOIN "dev-hub".projects p ON p.id = f.project_id WHERE p.user_id = $1 AND p.deleted_at IS NULL AND f.deleted_at IS NULL) AS total_frontends,
             (SELECT COUNT(*) FROM "dev-hub".ai_providers WHERE is_active = true) AS total_ai_providers,
             (SELECT COUNT(*) FROM "dev-hub".ai_accounts WHERE user_id = $1) AS total_ai_accounts`,
          [userId]
        ),
        query<{
          id: string;
          name: string;
          project_name: string;
          health_status: HealthStatus;
          response_time_ms: number | null;
          last_checked_at: Date | null;
        }>(
          `SELECT b.id, b.name, p.name AS project_name, b.health_status, b.response_time_ms, b.last_checked_at
           FROM "dev-hub".project_backends b
           JOIN "dev-hub".projects p ON p.id = b.project_id
           WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL
           ORDER BY b.last_checked_at DESC NULLS LAST, b.updated_at DESC
           LIMIT 5`,
          [userId]
        ),
        query<{
          id: string;
          code: string;
          name: string;
          status: ProjectStatus;
          updated_at: Date;
        }>(
          `SELECT id, code, name, status, updated_at
           FROM "dev-hub".projects
           WHERE user_id = $1 AND deleted_at IS NULL
           ORDER BY updated_at DESC
           LIMIT 5`,
          [userId]
        ),
        query<{
          id: string;
          project_id: string;
          slug: string;
          name: string;
          project_name: string;
        }>(
          `SELECT f.id, f.project_id, f.slug, f.name, p.name AS project_name
           FROM "dev-hub".project_frontends f
           JOIN "dev-hub".projects p ON p.id = f.project_id
           WHERE p.user_id = $1 AND p.deleted_at IS NULL AND f.deleted_at IS NULL AND f.is_active = true
           ORDER BY f.sort_order ASC, f.name ASC
           LIMIT 6`,
          [userId]
        ),
        query<{ name: string; count: string }>(
          `SELECT COALESCE(dp.name, 'Unassigned') AS name, COUNT(*) AS count
           FROM (
             SELECT b.deployment_platform_id
             FROM "dev-hub".project_backends b
             JOIN "dev-hub".projects p ON p.id = b.project_id
             WHERE p.user_id = $1 AND p.deleted_at IS NULL AND b.deleted_at IS NULL
             UNION ALL
             SELECT f.deployment_platform_id
             FROM "dev-hub".project_frontends f
             JOIN "dev-hub".projects p ON p.id = f.project_id
             WHERE p.user_id = $1 AND p.deleted_at IS NULL AND f.deleted_at IS NULL
           ) apps
           LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = apps.deployment_platform_id
           GROUP BY COALESCE(dp.name, 'Unassigned')
           ORDER BY COUNT(*) DESC
           LIMIT 6`,
          [userId]
        ),
      ]);

    return {
      counts: {
        totalProjects: Number(countsRow?.total_projects ?? 0),
        activeProjects: Number(countsRow?.active_projects ?? 0),
        totalBackends: Number(countsRow?.total_backends ?? 0),
        healthyBackends: Number(countsRow?.healthy_backends ?? 0),
        degradedBackends: Number(countsRow?.degraded_backends ?? 0),
        unhealthyBackends: Number(countsRow?.unhealthy_backends ?? 0),
        unreachableBackends: Number(countsRow?.unreachable_backends ?? 0),
        totalFrontends: Number(countsRow?.total_frontends ?? 0),
        totalAiProviders: Number(countsRow?.total_ai_providers ?? 0),
        totalAiAccounts: Number(countsRow?.total_ai_accounts ?? 0),
      },
      recentBackends: recentBackendsRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        projectName: r.project_name,
        healthStatus: r.health_status,
        responseTimeMs: r.response_time_ms,
        lastCheckedAt: r.last_checked_at,
      })),
      recentProjects: recentProjectsRes.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        status: r.status,
        updatedAt: r.updated_at,
      })),
      quickApps: quickAppsRes.rows.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        slug: r.slug,
        name: r.name,
        projectName: r.project_name,
      })),
      platformDistribution: platformRes.rows.map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
    };
  },
};
