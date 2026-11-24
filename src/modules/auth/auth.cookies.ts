import 'server-only';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'devhub_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
