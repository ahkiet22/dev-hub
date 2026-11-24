'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authService } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { projectService } from './project.service';
import type { ProjectStatus } from './project.types';

export interface ProjectActionState {
  error: string | null;
}

export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  let createdId: string;
  try {
    const { user } = await authService.requireSession();
    const project = await projectService.create(user.id, {
      code: String(formData.get('code') ?? ''),
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      iconUrl: String(formData.get('iconUrl') ?? '') || null,
      status: (String(formData.get('status') ?? 'ACTIVE') as ProjectStatus) || 'ACTIVE',
    });
    createdId = project.id;
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to create project',
    };
  }

  revalidatePath('/projects');
  redirect(`/projects/${createdId}`);
}

export async function updateProjectAction(
  projectId: string,
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  try {
    const { user } = await authService.requireSession();
    await projectService.update(user.id, projectId, {
      code: String(formData.get('code') ?? ''),
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      iconUrl: String(formData.get('iconUrl') ?? '') || null,
      status: (String(formData.get('status') ?? 'ACTIVE') as ProjectStatus) || 'ACTIVE',
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof AppError ? err.message : 'Failed to update project',
    };
  }
}

export async function archiveProjectAction(projectId: string): Promise<void> {
  const { user } = await authService.requireSession();
  await projectService.archive(user.id, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  const { user } = await authService.requireSession();
  await projectService.softDelete(user.id, projectId);
  revalidatePath('/projects');
  redirect('/projects');
}
