'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { backendService } from './backend.service';

export interface BackendActionState {
  error: string | null;
}

export async function createBackendAction(
  projectId: string,
  _prev: BackendActionState,
  formData: FormData
): Promise<BackendActionState> {
  try {
    const { user } = await authService.requireSession();
    await backendService.create(user.id, {
      projectId,
      deploymentPlatformId: String(formData.get('deploymentPlatformId') ?? '') || null,
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      repositoryUrl: String(formData.get('repositoryUrl') ?? '') || null,
      baseUrl: String(formData.get('baseUrl') ?? '') || null,
      healthUrl: String(formData.get('healthUrl') ?? ''),
      deploymentConsoleUrl: String(formData.get('deploymentConsoleUrl') ?? '') || null,
      checkIntervalSeconds: Number(formData.get('checkIntervalSeconds') ?? 60),
      timeoutMs: Number(formData.get('timeoutMs') ?? 5000),
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/backends');
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to register backend',
    };
  }
}

export async function toggleBackendAction(
  backendId: string,
  projectId: string,
  isActive: boolean
): Promise<void> {
  const { user } = await authService.requireSession();
  await backendService.toggleActive(user.id, backendId, isActive);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/backends');
}

export async function deleteBackendAction(
  backendId: string,
  projectId: string
): Promise<void> {
  const { user } = await authService.requireSession();
  await backendService.softDelete(user.id, backendId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/backends');
}
