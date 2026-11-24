import 'server-only';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors/app-error';
import { projectRepository } from './project.repository';
import type { Project, ProjectStatus, ProjectWithSummary } from './project.types';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from './project.validation';

export const projectService = {
  async listByUser(
    userId: string,
    filters?: { search?: string; status?: ProjectStatus }
  ): Promise<ProjectWithSummary[]> {
    return projectRepository.listByUser(userId, filters);
  },

  async getById(userId: string, projectId: string): Promise<Project> {
    const project = await projectRepository.findByIdAndUser(projectId, userId);
    if (!project) throw new NotFoundError('Project not found');
    return project;
  },

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid project input');
    }

    const existing = await projectRepository.findByCodeAndUser(
      parsed.data.code,
      userId
    );
    if (existing) {
      throw new ConflictError(`Project code "${parsed.data.code}" already exists`);
    }

    return projectRepository.create({
      userId,
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      iconUrl: parsed.data.iconUrl || null,
      status: parsed.data.status,
    });
  },

  async update(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid project input');
    }

    const duplicate = await projectRepository.findByCodeAndUser(
      parsed.data.code,
      userId,
      projectId
    );
    if (duplicate) {
      throw new ConflictError(`Project code "${parsed.data.code}" already exists`);
    }

    const updated = await projectRepository.update(projectId, userId, {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      iconUrl: parsed.data.iconUrl || null,
      status: parsed.data.status,
    });
    if (!updated) throw new NotFoundError('Project not found');
    return updated;
  },

  async archive(userId: string, projectId: string): Promise<void> {
    const ok = await projectRepository.setStatus(projectId, userId, 'ARCHIVED');
    if (!ok) throw new NotFoundError('Project not found');
  },

  async softDelete(userId: string, projectId: string): Promise<void> {
    const ok = await projectRepository.softDelete(projectId, userId);
    if (!ok) throw new NotFoundError('Project not found');
  },
};
