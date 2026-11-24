import 'server-only';
import { projectRepository } from '@/modules/project/project.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors/app-error';
import { frontendRepository } from './frontend.repository';
import type { ProjectFrontend } from './frontend.types';
import {
  createFrontendSchema,
  type CreateFrontendInput,
} from './frontend.validation';

export const frontendService = {
  async listByProject(userId: string, projectId: string): Promise<ProjectFrontend[]> {
    const project = await projectRepository.findByIdAndUser(projectId, userId);
    if (!project) throw new NotFoundError('Project not found');
    return frontendRepository.listByProjectAndUser(projectId, userId);
  },

  async listByUser(userId: string): Promise<ProjectFrontend[]> {
    return frontendRepository.listByUser(userId);
  },

  async getByProjectAndSlug(
    userId: string,
    projectId: string,
    slug: string
  ): Promise<ProjectFrontend> {
    const fe = await frontendRepository.findByProjectAndSlug(projectId, slug, userId);
    if (!fe) throw new NotFoundError('Frontend application not found');
    return fe;
  },

  async create(userId: string, input: CreateFrontendInput): Promise<ProjectFrontend> {
    const parsed = createFrontendSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid frontend input');
    }

    const project = await projectRepository.findByIdAndUser(parsed.data.projectId, userId);
    if (!project) throw new NotFoundError('Project not found');

    const existingSlug = await frontendRepository.findByProjectAndSlug(
      parsed.data.projectId,
      parsed.data.slug,
      userId
    );
    if (existingSlug) {
      throw new ConflictError(`Slug "${parsed.data.slug}" already exists in this project`);
    }

    return frontendRepository.create({
      projectId: parsed.data.projectId,
      deploymentPlatformId: parsed.data.deploymentPlatformId || null,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      repositoryUrl: parsed.data.repositoryUrl || null,
      applicationUrl: parsed.data.applicationUrl || null,
      deploymentConsoleUrl: parsed.data.deploymentConsoleUrl || null,
      integrationType: parsed.data.integrationType,
      entryUrl: parsed.data.entryUrl || null,
      remoteName: parsed.data.remoteName || null,
      exposedModule: parsed.data.exposedModule || null,
      iconUrl: parsed.data.iconUrl || null,
      sortOrder: parsed.data.sortOrder,
    });
  },

  async toggleActive(userId: string, frontendId: string, isActive: boolean): Promise<void> {
    const ok = await frontendRepository.toggleActive(frontendId, userId, isActive);
    if (!ok) throw new NotFoundError('Frontend not found');
  },

  async softDelete(userId: string, frontendId: string): Promise<void> {
    const ok = await frontendRepository.softDelete(frontendId, userId);
    if (!ok) throw new NotFoundError('Frontend not found');
  },
};
