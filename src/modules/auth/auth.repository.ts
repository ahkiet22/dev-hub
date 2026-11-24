import 'server-only';
import { query, queryOne, type QueryClient } from '@/platform/database/client';
import type { AuthUser, UserRecord, UserSession } from './auth.types';

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface SessionRow {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  last_used_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
}

interface SessionWithUserRow extends SessionRow {
  u_email: string;
  u_username: string;
  u_full_name: string | null;
  u_avatar_url: string | null;
  u_is_active: boolean;
  u_last_login_at: Date | null;
  u_created_at: Date;
  u_updated_at: Date;
}

function mapUserRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSessionRow(row: SessionRow): UserSession {
  return {
    id: row.id,
    userId: row.user_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export const authRepository = {
  async findUserByIdentifier(
    identifier: string,
    client?: QueryClient
  ): Promise<UserRecord | null> {
    const normalized = identifier.trim().toLowerCase();
    const row = await queryOne<UserRow>(
      `SELECT id, email, username, password_hash, full_name, avatar_url,
              is_active, last_login_at, created_at, updated_at
       FROM "dev-hub".users
       WHERE deleted_at IS NULL
         AND (email = $1 OR lower(username) = $1)
       LIMIT 1`,
      [normalized],
      client
    );
    return row ? mapUserRow(row) : null;
  },

  async findUserById(id: string, client?: QueryClient): Promise<UserRecord | null> {
    const row = await queryOne<UserRow>(
      `SELECT id, email, username, password_hash, full_name, avatar_url,
              is_active, last_login_at, created_at, updated_at
       FROM "dev-hub".users
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [id],
      client
    );
    return row ? mapUserRow(row) : null;
  },

  async updateLastLogin(userId: string, client?: QueryClient): Promise<void> {
    await query(
      `UPDATE "dev-hub".users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
      [userId],
      client
    );
  },

  async updateProfile(
    userId: string,
    fullName: string | null,
    avatarUrl: string | null,
    client?: QueryClient
  ): Promise<AuthUser | null> {
    const row = await queryOne<UserRow>(
      `UPDATE "dev-hub".users
       SET full_name = $2, avatar_url = $3, updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, email, username, password_hash, full_name, avatar_url,
                 is_active, last_login_at, created_at, updated_at`,
      [userId, fullName, avatarUrl],
      client
    );
    if (!row) return null;
    const { passwordHash: _ignored, ...user } = mapUserRow(row);
    void _ignored;
    return user;
  },

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
    client?: QueryClient
  ): Promise<void> {
    await query(
      `UPDATE "dev-hub".users SET password_hash = $2, updated_at = now() WHERE id = $1`,
      [userId, passwordHash],
      client
    );
  },

  async disableUser(userId: string, client?: QueryClient): Promise<void> {
    await query(
      `UPDATE "dev-hub".users SET is_active = false, updated_at = now() WHERE id = $1`,
      [userId],
      client
    );
  },

  async createSession(
    params: {
      userId: string;
      tokenHash: string;
      ipAddress: string | null;
      userAgent: string | null;
      expiresAt: Date;
    },
    client?: QueryClient
  ): Promise<UserSession> {
    const row = await queryOne<SessionRow>(
      `INSERT INTO "dev-hub".user_sessions
         (user_id, token_hash, ip_address, user_agent, expires_at, last_used_at)
       VALUES ($1, $2, $3::inet, $4, $5, now())
       RETURNING id, user_id, ip_address::text, user_agent, expires_at, last_used_at, revoked_at, created_at`,
      [
        params.userId,
        params.tokenHash,
        params.ipAddress,
        params.userAgent,
        params.expiresAt,
      ],
      client
    );
    if (!row) throw new Error('Failed to create session');
    return mapSessionRow(row);
  },

  async findValidSessionByTokenHash(
    tokenHash: string,
    client?: QueryClient
  ): Promise<{ session: UserSession; user: AuthUser } | null> {
    const row = await queryOne<SessionWithUserRow>(
      `SELECT
         s.id, s.user_id, s.ip_address::text, s.user_agent, s.expires_at,
         s.last_used_at, s.revoked_at, s.created_at,
         u.email AS u_email, u.username AS u_username,
         u.full_name AS u_full_name, u.avatar_url AS u_avatar_url,
         u.is_active AS u_is_active, u.last_login_at AS u_last_login_at,
         u.created_at AS u_created_at, u.updated_at AS u_updated_at
       FROM "dev-hub".user_sessions s
       JOIN "dev-hub".users u ON u.id = s.user_id
       WHERE s.token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > now()
         AND u.is_active = true
         AND u.deleted_at IS NULL
       LIMIT 1`,
      [tokenHash],
      client
    );
    if (!row) return null;

    return {
      session: mapSessionRow(row),
      user: {
        id: row.user_id,
        email: row.u_email,
        username: row.u_username,
        fullName: row.u_full_name,
        avatarUrl: row.u_avatar_url,
        isActive: row.u_is_active,
        lastLoginAt: row.u_last_login_at,
        createdAt: row.u_created_at,
        updatedAt: row.u_updated_at,
      },
    };
  },

  async touchSession(sessionId: string, client?: QueryClient): Promise<void> {
    await query(
      `UPDATE "dev-hub".user_sessions SET last_used_at = now() WHERE id = $1`,
      [sessionId],
      client
    );
  },

  async revokeSessionByTokenHash(
    tokenHash: string,
    client?: QueryClient
  ): Promise<void> {
    await query(
      `UPDATE "dev-hub".user_sessions
       SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
      client
    );
  },

  async revokeSessionById(
    sessionId: string,
    userId: string,
    client?: QueryClient
  ): Promise<boolean> {
    const res = await query(
      `UPDATE "dev-hub".user_sessions
       SET revoked_at = now()
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [sessionId, userId],
      client
    );
    return (res.rowCount ?? 0) > 0;
  },

  async revokeAllUserSessions(userId: string, client?: QueryClient): Promise<void> {
    await query(
      `UPDATE "dev-hub".user_sessions
       SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
      client
    );
  },

  async listActiveSessions(userId: string, client?: QueryClient): Promise<UserSession[]> {
    const res = await query<SessionRow>(
      `SELECT id, user_id, ip_address::text, user_agent, expires_at, last_used_at, revoked_at, created_at
       FROM "dev-hub".user_sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
       ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
      [userId],
      client
    );
    return res.rows.map(mapSessionRow);
  },
};
