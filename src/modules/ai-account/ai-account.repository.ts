import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { AiAccount } from './ai-account.types';

interface AccountRow {
  id: string;
  user_id: string;
  provider_id: string;
  provider_code: string;
  provider_name: string;
  provider_website_url: string;
  provider_logo_url: string | null;
  email: string;
  note: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: AccountRow): AiAccount {
  return {
    id: row.id,
    userId: row.user_id,
    providerId: row.provider_id,
    providerCode: row.provider_code,
    providerName: row.provider_name,
    providerWebsiteUrl: row.provider_website_url,
    providerLogoUrl: row.provider_logo_url,
    email: row.email,
    note: row.note,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const aiAccountRepository = {
  async listByUser(
    userId: string,
    filters?: { search?: string; providerId?: string },
    client?: QueryClient
  ): Promise<AiAccount[]> {
    const params: unknown[] = [userId];
    const conditions: string[] = ['a.user_id = $1'];

    if (filters?.providerId) {
      params.push(filters.providerId);
      conditions.push(`a.provider_id = $${params.length}`);
    }
    if (filters?.search?.trim()) {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(`(a.email ILIKE $${params.length} OR a.note ILIKE $${params.length})`);
    }

    const res = await query<AccountRow>(
      `SELECT
         a.id, a.user_id, a.provider_id,
         p.code AS provider_code, p.name AS provider_name,
         p.website_url AS provider_website_url, p.logo_url AS provider_logo_url,
         a.email, a.note, a.is_active, a.created_at, a.updated_at
       FROM "dev-hub".ai_accounts a
       JOIN "dev-hub".ai_providers p ON p.id = a.provider_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.name ASC, a.email ASC`,
      params,
      client
    );
    return res.rows.map(mapRow);
  },

  async existsForUser(
    userId: string,
    providerId: string,
    email: string,
    client?: QueryClient
  ): Promise<boolean> {
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM "dev-hub".ai_accounts
       WHERE user_id = $1 AND provider_id = $2 AND email = $3
       LIMIT 1`,
      [userId, providerId, email],
      client
    );
    return row !== null;
  },

  async create(
    input: {
      userId: string;
      providerId: string;
      email: string;
      note: string | null;
    },
    client?: QueryClient
  ): Promise<void> {
    await query(
      `INSERT INTO "dev-hub".ai_accounts (user_id, provider_id, email, note)
       VALUES ($1, $2, $3, $4)`,
      [input.userId, input.providerId, input.email, input.note],
      client
    );
  },

  async toggleActive(
    id: string,
    userId: string,
    isActive: boolean,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".ai_accounts
       SET is_active = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2`,
      [id, userId, isActive],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },

  async deleteByIdAndUser(
    id: string,
    userId: string,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `DELETE FROM "dev-hub".ai_accounts WHERE id = $1 AND user_id = $2`,
      [id, userId],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },
};
