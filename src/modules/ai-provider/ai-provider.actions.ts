'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { aiProviderService } from './ai-provider.service';

export interface ProviderActionState {
  error: string | null;
}

export async function createAiProviderAction(
  _prev: ProviderActionState,
  formData: FormData
): Promise<ProviderActionState> {
  try {
    await authService.requireSession();
    await aiProviderService.create({
      code: String(formData.get('code') ?? ''),
      name: String(formData.get('name') ?? ''),
      websiteUrl: String(formData.get('websiteUrl') ?? ''),
      logoUrl: String(formData.get('logoUrl') ?? '') || null,
      description: String(formData.get('description') ?? '') || null,
    });
    revalidatePath('/ai/providers');
    revalidatePath('/ai/accounts');
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to create AI provider',
    };
  }
}

export async function toggleAiProviderAction(id: string, isActive: boolean): Promise<void> {
  await authService.requireSession();
  await aiProviderService.toggleActive(id, isActive);
  revalidatePath('/ai/providers');
  revalidatePath('/ai/accounts');
}
