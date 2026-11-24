'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppError } from '@/shared/errors/app-error';
import { clearSessionCookie, setSessionCookie } from './auth.cookies';
import { authService } from './auth.service';

export interface LoginActionState {
  error: string | null;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const identifier = String(formData.get('identifier') ?? '');
  const password = String(formData.get('password') ?? '');

  const hdrs = await headers();
  const ipAddress =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    null;
  const userAgent = hdrs.get('user-agent') ?? null;

  try {
    const { token, expiresAt } = await authService.login(
      { identifier, password },
      { ipAddress, userAgent }
    );
    await setSessionCookie(token, expiresAt);
  } catch (err) {
    if (err instanceof AppError) {
      return { error: err.message };
    }
    return { error: 'Unable to sign in. Please try again.' };
  }

  redirect('/overview');
}

export async function logoutAction(): Promise<void> {
  await authService.logout();
  await clearSessionCookie();
  redirect('/login');
}
