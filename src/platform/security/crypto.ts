import 'server-only';
import crypto from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

const ARGON2ID_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2ID_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Generates a 256-bit cryptographically random opaque session token (base64url).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Computes the SHA-256 hex digest of an opaque session token for DB storage.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
