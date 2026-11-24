'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { platformService } from './platform.service';

export interface ActionResult {
  error: string | null;
}

export async function createPlatformAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    await authService.requireSession();
    await platformService.create({
      code: String(formData.get('code') ?? ''),
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      websiteUrl: String(formData.get('websiteUrl') ?? '') || null,
      consoleUrl: String(formData.get('consoleUrl') ?? '') || null,
      iconUrl: null,
    });
    revalidatePath('/settings/platforms');
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to create platform',
    };
  }
}

export async function togglePlatformAction(id: string, isActive: boolean): Promise<void> {
  await authService.requireSession();
  await platformService.toggleActive(id, isActive);
  revalidatePath('/settings/platforms');
}
