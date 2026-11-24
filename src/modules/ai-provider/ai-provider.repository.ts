import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { AiProvider } from './ai-provider.types';

interface ProviderRow {
  id: string;
  code: string;
  name: string;
  website_url: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: ProviderRow): AiProvider {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    websiteUrl: row.website_url,
    logoUrl: row.logo_url,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const aiProviderRepository = {
  async listAll(
    filters?: { onlyActive?: boolean; search?: string },
    client?: QueryClient
  ): Promise<AiProvider[]> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters?.onlyActive) {
      conditions.push('is_active = true');
    }
    if (filters?.search?.trim()) {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(`(name ILIKE $${params.length} OR code ILIKE $${params.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await query<ProviderRow>(
      `SELECT id, code, name, website_url, logo_url, description, is_active, created_at, updated_at
       FROM "dev-hub".ai_providers
       ${where}
       ORDER BY name ASC`,
      params,
      client
    );
    return res.rows.map(mapRow);
  },

  async findById(id: string, client?: QueryClient): Promise<AiProvider | null> {
    const row = await queryOne<ProviderRow>(
      `SELECT id, code, name, website_url, logo_url, description, is_active, created_at, updated_at
       FROM "dev-hub".ai_providers
       WHERE id = $1 LIMIT 1`,
      [id],
      client
    );
    return row ? mapRow(row) : null;
  },

  async findByCode(code: string, client?: QueryClient): Promise<AiProvider | null> {
    const row = await queryOne<ProviderRow>(
      `SELECT id, code, name, website_url, logo_url, description, is_active, created_at, updated_at
       FROM "dev-hub".ai_providers
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
      websiteUrl: string;
      logoUrl: string | null;
      description: string | null;
    },
    client?: QueryClient
  ): Promise<AiProvider> {
    const row = await queryOne<ProviderRow>(
      `INSERT INTO "dev-hub".ai_providers (code, name, website_url, logo_url, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, name, website_url, logo_url, description, is_active, created_at, updated_at`,
      [input.code, input.name, input.websiteUrl, input.logoUrl, input.description],
      client
    );
    if (!row) throw new Error('Failed to create AI provider');
    return mapRow(row);
  },

  async toggleActive(id: string, isActive: boolean, client?: QueryClient): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".ai_providers SET is_active = $2, updated_at = now() WHERE id = $1`,
      [id, isActive],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },
};
