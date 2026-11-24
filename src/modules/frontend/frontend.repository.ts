import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { FrontendIntegrationType, ProjectFrontend } from './frontend.types';

interface FrontendRow {
  id: string;
  project_id: string;
  project_name?: string;
  deployment_platform_id: string | null;
  platform_name?: string | null;
  name: string;
  slug: string;
  description: string | null;
  repository_url: string | null;
  application_url: string | null;
  deployment_console_url: string | null;
  integration_type: FrontendIntegrationType;
  entry_url: string | null;
  remote_name: string | null;
  exposed_module: string | null;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: FrontendRow): ProjectFrontend {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    deploymentPlatformId: row.deployment_platform_id,
    platformName: row.platform_name ?? null,
    name: row.name,
    slug: row.slug,
    description: row.description,
    repositoryUrl: row.repository_url,
    applicationUrl: row.application_url,
    deploymentConsoleUrl: row.deployment_console_url,
    integrationType: row.integration_type,
    entryUrl: row.entry_url,
    remoteName: row.remote_name,
    exposedModule: row.exposed_module,
    iconUrl: row.icon_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const frontendRepository = {
  async listByProjectAndUser(
    projectId: string,
    userId: string,
    client?: QueryClient
  ): Promise<ProjectFrontend[]> {
    const res = await query<FrontendRow>(
      `SELECT
         f.id, f.project_id, p.name AS project_name,
         f.deployment_platform_id, dp.name AS platform_name,
         f.name, f.slug, f.description, f.repository_url, f.application_url,
         f.deployment_console_url, f.integration_type, f.entry_url, f.remote_name,
         f.exposed_module, f.icon_url, f.sort_order, f.is_active,
         f.created_at, f.updated_at
       FROM "dev-hub".project_frontends f
       JOIN "dev-hub".projects p ON p.id = f.project_id
       LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = f.deployment_platform_id
       WHERE f.project_id = $1
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND f.deleted_at IS NULL
       ORDER BY f.sort_order ASC, f.created_at DESC`,
      [projectId, userId],
      client
    );
    return res.rows.map(mapRow);
  },

  async listByUser(userId: string, client?: QueryClient): Promise<ProjectFrontend[]> {
    const res = await query<FrontendRow>(
      `SELECT
         f.id, f.project_id, p.name AS project_name,
         f.deployment_platform_id, dp.name AS platform_name,
         f.name, f.slug, f.description, f.repository_url, f.application_url,
         f.deployment_console_url, f.integration_type, f.entry_url, f.remote_name,
         f.exposed_module, f.icon_url, f.sort_order, f.is_active,
         f.created_at, f.updated_at
       FROM "dev-hub".project_frontends f
       JOIN "dev-hub".projects p ON p.id = f.project_id
       LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = f.deployment_platform_id
       WHERE p.user_id = $1
         AND p.deleted_at IS NULL
         AND f.deleted_at IS NULL
       ORDER BY f.sort_order ASC, f.name ASC`,
      [userId],
      client
    );
    return res.rows.map(mapRow);
  },

  async findByProjectAndSlug(
    projectId: string,
    slug: string,
    userId: string,
    client?: QueryClient
  ): Promise<ProjectFrontend | null> {
    const row = await queryOne<FrontendRow>(
      `SELECT
         f.id, f.project_id, p.name AS project_name,
         f.deployment_platform_id, dp.name AS platform_name,
         f.name, f.slug, f.description, f.repository_url, f.application_url,
         f.deployment_console_url, f.integration_type, f.entry_url, f.remote_name,
         f.exposed_module, f.icon_url, f.sort_order, f.is_active,
         f.created_at, f.updated_at
       FROM "dev-hub".project_frontends f
       JOIN "dev-hub".projects p ON p.id = f.project_id
       LEFT JOIN "dev-hub".deployment_platforms dp ON dp.id = f.deployment_platform_id
       WHERE f.project_id = $1
         AND f.slug = $2
         AND p.user_id = $3
         AND p.deleted_at IS NULL
         AND f.deleted_at IS NULL
       LIMIT 1`,
      [projectId, slug, userId],
      client
    );
    return row ? mapRow(row) : null;
  },

  async create(
    input: {
      projectId: string;
      deploymentPlatformId: string | null;
      name: string;
      slug: string;
      description: string | null;
      repositoryUrl: string | null;
      applicationUrl: string | null;
      deploymentConsoleUrl: string | null;
      integrationType: FrontendIntegrationType;
      entryUrl: string | null;
      remoteName: string | null;
      exposedModule: string | null;
      iconUrl: string | null;
      sortOrder: number;
    },
    client?: QueryClient
  ): Promise<ProjectFrontend> {
    const row = await queryOne<FrontendRow>(
      `INSERT INTO "dev-hub".project_frontends (
         project_id, deployment_platform_id, name, slug, description,
         repository_url, application_url, deployment_console_url,
         integration_type, entry_url, remote_name, exposed_module,
         icon_url, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, project_id, deployment_platform_id, name, slug, description,
                 repository_url, application_url, deployment_console_url,
                 integration_type, entry_url, remote_name, exposed_module,
                 icon_url, sort_order, is_active, created_at, updated_at`,
      [
        input.projectId,
        input.deploymentPlatformId,
        input.name,
        input.slug,
        input.description,
        input.repositoryUrl,
        input.applicationUrl,
        input.deploymentConsoleUrl,
        input.integrationType,
        input.entryUrl,
        input.remoteName,
        input.exposedModule,
        input.iconUrl,
        input.sortOrder,
      ],
      client
    );
    if (!row) throw new Error('Failed to create frontend');
    return mapRow(row);
  },

  async toggleActive(
    id: string,
    userId: string,
    isActive: boolean,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".project_frontends f
       SET is_active = $3, updated_at = now()
       FROM "dev-hub".projects p
       WHERE f.id = $1
         AND f.project_id = p.id
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND f.deleted_at IS NULL`,
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
      `UPDATE "dev-hub".project_frontends f
       SET deleted_at = now(), updated_at = now()
       FROM "dev-hub".projects p
       WHERE f.id = $1
         AND f.project_id = p.id
         AND p.user_id = $2
         AND p.deleted_at IS NULL
         AND f.deleted_at IS NULL`,
      [id, userId],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },
};
