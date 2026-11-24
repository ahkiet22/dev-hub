'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { aiAccountService } from './ai-account.service';

export interface AccountActionState {
  error: string | null;
}

export async function createAiAccountAction(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    const { user } = await authService.requireSession();
    await aiAccountService.create(user.id, {
      providerId: String(formData.get('providerId') ?? ''),
      email: String(formData.get('email') ?? ''),
      note: String(formData.get('note') ?? '') || null,
    });
    revalidatePath('/ai/accounts');
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to register AI account',
    };
  }
}

export async function toggleAiAccountAction(id: string, isActive: boolean): Promise<void> {
  const { user } = await authService.requireSession();
  await aiAccountService.toggleActive(user.id, id, isActive);
  revalidatePath('/ai/accounts');
}

export async function deleteAiAccountAction(id: string): Promise<void> {
  const { user } = await authService.requireSession();
  await aiAccountService.remove(user.id, id);
  revalidatePath('/ai/accounts');
}
