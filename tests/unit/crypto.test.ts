import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from '@/platform/security/crypto';
import { checkRateLimit, resetRateLimit } from '@/platform/security/rate-limit';

describe('crypto security helpers', () => {
  it('hashes and verifies passwords with Argon2id', async () => {
    const hash = await hashPassword('super-secret-password');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'super-secret-password')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('generates 256-bit opaque session tokens and SHA-256 digests', () => {
    const t1 = generateSessionToken();
    const t2 = generateSessionToken();
    expect(t1).not.toBe(t2);
    expect(Buffer.from(t1, 'base64url').length).toBe(32);

    const h1 = hashSessionToken(t1);
    expect(h1).toHaveLength(64);
    expect(h1).toBe(hashSessionToken(t1));
  });

  it('enforces login rate limits and allows reset', () => {
    const key = 'test-login-key';
    resetRateLimit(key);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);
    resetRateLimit(key);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
  });
});
