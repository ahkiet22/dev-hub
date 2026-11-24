import 'server-only';
import { projectRepository } from '@/modules/project/project.repository';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import { backendRepository } from './backend.repository';
import type { ProjectBackend } from './backend.types';
import {
  createBackendSchema,
  updateBackendSchema,
  type CreateBackendInput,
  type UpdateBackendInput,
} from './backend.validation';

export const backendService = {
  async listByProject(userId: string, projectId: string): Promise<ProjectBackend[]> {
    const project = await projectRepository.findByIdAndUser(projectId, userId);
    if (!project) throw new NotFoundError('Project not found');
    return backendRepository.listByProjectAndUser(projectId, userId);
  },

  async listByUser(userId: string): Promise<ProjectBackend[]> {
    return backendRepository.listByUser(userId);
  },

  async getById(userId: string, backendId: string): Promise<ProjectBackend> {
    const backend = await backendRepository.findByIdAndUser(backendId, userId);
    if (!backend) throw new NotFoundError('Backend not found');
    return backend;
  },

  async create(userId: string, input: CreateBackendInput): Promise<ProjectBackend> {
    const parsed = createBackendSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid backend input');
    }

    const project = await projectRepository.findByIdAndUser(parsed.data.projectId, userId);
    if (!project) throw new NotFoundError('Project not found');

    return backendRepository.create({
      projectId: parsed.data.projectId,
      deploymentPlatformId: parsed.data.deploymentPlatformId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      repositoryUrl: parsed.data.repositoryUrl || null,
      baseUrl: parsed.data.baseUrl || null,
      healthUrl: parsed.data.healthUrl,
      deploymentConsoleUrl: parsed.data.deploymentConsoleUrl || null,
      checkIntervalSeconds: parsed.data.checkIntervalSeconds,
      timeoutMs: parsed.data.timeoutMs,
    });
  },

  async update(
    userId: string,
    backendId: string,
    input: UpdateBackendInput
  ): Promise<ProjectBackend> {
    const parsed = updateBackendSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid backend input');
    }

    const updated = await backendRepository.update(backendId, userId, {
      deploymentPlatformId: parsed.data.deploymentPlatformId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      repositoryUrl: parsed.data.repositoryUrl || null,
      baseUrl: parsed.data.baseUrl || null,
      healthUrl: parsed.data.healthUrl,
      deploymentConsoleUrl: parsed.data.deploymentConsoleUrl || null,
      checkIntervalSeconds: parsed.data.checkIntervalSeconds,
      timeoutMs: parsed.data.timeoutMs,
      isActive: parsed.data.isActive,
    });
    if (!updated) throw new NotFoundError('Backend not found');
    return updated;
  },

  async toggleActive(userId: string, backendId: string, isActive: boolean): Promise<void> {
    const ok = await backendRepository.toggleActive(backendId, userId, isActive);
    if (!ok) throw new NotFoundError('Backend not found');
  },

  async softDelete(userId: string, backendId: string): Promise<void> {
    const ok = await backendRepository.softDelete(backendId, userId);
    if (!ok) throw new NotFoundError('Backend not found');
  },
};
