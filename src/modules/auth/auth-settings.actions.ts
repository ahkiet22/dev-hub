'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AppError } from '@/shared/errors/app-error';
import { clearSessionCookie } from './auth.cookies';
import { authService } from './auth.service';

export interface SettingsActionState {
  error: string | null;
  success: string | null;
}

export async function updateProfileAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const { user } = await authService.requireSession();
    await authService.updateProfile(user.id, {
      fullName: String(formData.get('fullName') ?? '') || null,
      avatarUrl: String(formData.get('avatarUrl') ?? '') || null,
    });
    revalidatePath('/settings/profile');
    return { error: null, success: 'Profile updated.' };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to update profile',
      success: null,
    };
  }
}

export async function changePasswordAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const { user } = await authService.requireSession();
    await authService.changePassword(user.id, {
      currentPassword: String(formData.get('currentPassword') ?? ''),
      newPassword: String(formData.get('newPassword') ?? ''),
    });
    await clearSessionCookie();
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to change password',
      success: null,
    };
  }

  redirect('/login');
}

export async function revokeSessionAction(sessionId: string): Promise<void> {
  const { user } = await authService.requireSession();
  await authService.revokeSession(user.id, sessionId);
  revalidatePath('/settings/sessions');
}

export async function logoutAllSessionsAction(): Promise<void> {
  const { user } = await authService.requireSession();
  await authService.logoutAll(user.id);
  await clearSessionCookie();
  redirect('/login');
}
