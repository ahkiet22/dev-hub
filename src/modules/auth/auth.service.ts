import 'server-only';
import { withTransaction } from '@/platform/database/client';
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from '@/platform/security/crypto';
import { checkRateLimit, resetRateLimit } from '@/platform/security/rate-limit';
import {
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from '@/shared/errors/app-error';
import { authRepository } from './auth.repository';
import {
  getSessionTokenFromCookies,
  SESSION_TTL_SECONDS,
} from './auth.cookies';
import type { AuthenticatedSession, AuthUser, UserSession } from './auth.types';
import {
  changePasswordSchema,
  loginSchema,
  updateProfileSchema,
} from './auth.validation';

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export const authService = {
  async login(
    input: { identifier: string; password: string },
    context: { ipAddress: string | null; userAgent: string | null }
  ): Promise<{ token: string; expiresAt: Date; user: AuthUser }> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid login input');
    }

    const rateKey = `login:${context.ipAddress ?? 'unknown'}:${parsed.data.identifier.toLowerCase()}`;
    const rate = checkRateLimit(rateKey);
    if (!rate.allowed) {
      throw new RateLimitError(
        `Too many login attempts. Try again in ${rate.retryAfterSeconds}s.`
      );
    }

    const userRecord = await authRepository.findUserByIdentifier(parsed.data.identifier);
    if (!userRecord || !userRecord.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await verifyPassword(userRecord.passwordHash, parsed.data.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    resetRateLimit(rateKey);

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

    await withTransaction(async (client) => {
      await authRepository.createSession(
        {
          userId: userRecord.id,
          tokenHash,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          expiresAt,
        },
        client
      );
      await authRepository.updateLastLogin(userRecord.id, client);
    });

    const { passwordHash: _ignored, ...user } = userRecord;
    void _ignored;

    return { token: rawToken, expiresAt, user };
  },

  async getCurrentSession(): Promise<AuthenticatedSession | null> {
    const token = await getSessionTokenFromCookies();
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const result = await authRepository.findValidSessionByTokenHash(tokenHash);
    if (!result) return null;

    const lastUsed = result.session.lastUsedAt?.getTime() ?? 0;
    if (Date.now() - lastUsed > TOUCH_INTERVAL_MS) {
      await authRepository.touchSession(result.session.id);
    }

    return result;
  },

  async requireSession(): Promise<AuthenticatedSession> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new UnauthorizedError('Authentication required');
    }
    return current;
  },

  async logout(): Promise<void> {
    const token = await getSessionTokenFromCookies();
    if (!token) return;
    const tokenHash = hashSessionToken(token);
    await authRepository.revokeSessionByTokenHash(tokenHash);
  },

  async logoutAll(userId: string): Promise<void> {
    await authRepository.revokeAllUserSessions(userId);
  },

  async listActiveSessions(userId: string): Promise<UserSession[]> {
    return authRepository.listActiveSessions(userId);
  },

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const revoked = await authRepository.revokeSessionById(sessionId, userId);
    if (!revoked) {
      throw new NotFoundError('Session not found');
    }
  },

  async updateProfile(
    userId: string,
    input: { fullName?: string | null; avatarUrl?: string | null }
  ): Promise<AuthUser> {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid profile input');
    }

    const updated = await authRepository.updateProfile(
      userId,
      parsed.data.fullName || null,
      parsed.data.avatarUrl || null
    );
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  },

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid password input');
    }

    const userRecord = await authRepository.findUserById(userId);
    if (!userRecord) throw new NotFoundError('User not found');

    const matches = await verifyPassword(
      userRecord.passwordHash,
      parsed.data.currentPassword
    );
    if (!matches) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await withTransaction(async (client) => {
      await authRepository.updatePasswordHash(userId, newHash, client);
      await authRepository.revokeAllUserSessions(userId, client);
    });
  },

  async disableAccount(userId: string): Promise<void> {
    await withTransaction(async (client) => {
      await authRepository.disableUser(userId, client);
      await authRepository.revokeAllUserSessions(userId, client);
    });
  },
};
