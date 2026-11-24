'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { frontendService } from './frontend.service';
import type { FrontendIntegrationType } from './frontend.types';

export interface FrontendActionState {
  error: string | null;
}

export async function createFrontendAction(
  projectId: string,
  _prev: FrontendActionState,
  formData: FormData
): Promise<FrontendActionState> {
  try {
    const { user } = await authService.requireSession();
    await frontendService.create(user.id, {
      projectId,
      deploymentPlatformId: String(formData.get('deploymentPlatformId') ?? '') || null,
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      repositoryUrl: String(formData.get('repositoryUrl') ?? '') || null,
      applicationUrl: String(formData.get('applicationUrl') ?? '') || null,
      deploymentConsoleUrl: String(formData.get('deploymentConsoleUrl') ?? '') || null,
      integrationType: (String(formData.get('integrationType') ?? 'MODULE_FEDERATION') as FrontendIntegrationType),
      entryUrl: String(formData.get('entryUrl') ?? '') || null,
      remoteName: String(formData.get('remoteName') ?? '') || null,
      exposedModule: String(formData.get('exposedModule') ?? '') || null,
      iconUrl: null,
      sortOrder: Number(formData.get('sortOrder') ?? 0),
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/applications');
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to register frontend',
    };
  }
}

export async function toggleFrontendAction(
  frontendId: string,
  projectId: string,
  isActive: boolean
): Promise<void> {
  const { user } = await authService.requireSession();
  await frontendService.toggleActive(user.id, frontendId, isActive);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/applications');
}

export async function deleteFrontendAction(
  frontendId: string,
  projectId: string
): Promise<void> {
  const { user } = await authService.requireSession();
  await frontendService.softDelete(user.id, frontendId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/applications');
}
