import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { DeploymentPlatform } from './platform.types';

interface PlatformRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  website_url: string | null;
  console_url: string | null;
  icon_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: PlatformRow): DeploymentPlatform {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    websiteUrl: row.website_url,
    consoleUrl: row.console_url,
    iconUrl: row.icon_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const platformRepository = {
  async listAll(onlyActive = false, client?: QueryClient): Promise<DeploymentPlatform[]> {
    const where = onlyActive ? 'WHERE is_active = true' : '';
    const res = await query<PlatformRow>(
      `SELECT id, code, name, description, website_url, console_url, icon_url,
              is_active, created_at, updated_at
       FROM "dev-hub".deployment_platforms
       ${where}
       ORDER BY name ASC`,
      [],
      client
    );
    return res.rows.map(mapRow);
  },

  async findById(id: string, client?: QueryClient): Promise<DeploymentPlatform | null> {
    const row = await queryOne<PlatformRow>(
      `SELECT id, code, name, description, website_url, console_url, icon_url,
              is_active, created_at, updated_at
       FROM "dev-hub".deployment_platforms
       WHERE id = $1 LIMIT 1`,
      [id],
      client
    );
    return row ? mapRow(row) : null;
  },

  async findByCode(code: string, client?: QueryClient): Promise<DeploymentPlatform | null> {
    const row = await queryOne<PlatformRow>(
      `SELECT id, code, name, description, website_url, console_url, icon_url,
              is_active, created_at, updated_at
       FROM "dev-hub".deployment_platforms
       WHERE code = $1 LIMIT 1`,
      [code],
      client
    );
    return row ? mapRow(row) : null;
  },

  async create(
    input: {
      code: string;
      name: string;
      description: string | null;
      websiteUrl: string | null;
      consoleUrl: string | null;
      iconUrl: string | null;
    },
    client?: QueryClient
  ): Promise<DeploymentPlatform> {
    const row = await queryOne<PlatformRow>(
      `INSERT INTO "dev-hub".deployment_platforms
         (code, name, description, website_url, console_url, icon_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, name, description, website_url, console_url, icon_url,
                 is_active, created_at, updated_at`,
      [
        input.code,
        input.name,
        input.description,
        input.websiteUrl,
        input.consoleUrl,
        input.iconUrl,
      ],
      client
    );
    if (!row) throw new Error('Failed to create deployment platform');
    return mapRow(row);
  },

  async update(
    id: string,
    input: {
      name: string;
      description: string | null;
      websiteUrl: string | null;
      consoleUrl: string | null;
      iconUrl: string | null;
      isActive?: boolean;
    },
    client?: QueryClient
  ): Promise<DeploymentPlatform | null> {
    const row = await queryOne<PlatformRow>(
      `UPDATE "dev-hub".deployment_platforms
       SET name = $2,
           description = $3,
           website_url = $4,
           console_url = $5,
           icon_url = $6,
           is_active = COALESCE($7, is_active),
           updated_at = now()
       WHERE id = $1
       RETURNING id, code, name, description, website_url, console_url, icon_url,
                 is_active, created_at, updated_at`,
      [
        id,
        input.name,
        input.description,
        input.websiteUrl,
        input.consoleUrl,
        input.iconUrl,
        input.isActive ?? null,
      ],
      client
    );
    return row ? mapRow(row) : null;
  },

  async toggleActive(id: string, isActive: boolean, client?: QueryClient): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".deployment_platforms
       SET is_active = $2, updated_at = now()
       WHERE id = $1`,
      [id, isActive],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },
};
