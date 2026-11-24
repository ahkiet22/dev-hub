import 'server-only';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors/app-error';
import { platformRepository } from './platform.repository';
import type { DeploymentPlatform } from './platform.types';
import {
  createPlatformSchema,
  updatePlatformSchema,
  type CreatePlatformInput,
  type UpdatePlatformInput,
} from './platform.validation';

export const platformService = {
  async listAll(onlyActive = false): Promise<DeploymentPlatform[]> {
    return platformRepository.listAll(onlyActive);
  },

  async create(input: CreatePlatformInput): Promise<DeploymentPlatform> {
    const parsed = createPlatformSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid platform input');
    }

    const existing = await platformRepository.findByCode(parsed.data.code);
    if (existing) {
      throw new ConflictError(`Deployment platform "${parsed.data.code}" already exists`);
    }

    return platformRepository.create({
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      websiteUrl: parsed.data.websiteUrl || null,
      consoleUrl: parsed.data.consoleUrl || null,
      iconUrl: parsed.data.iconUrl || null,
    });
  },

  async update(id: string, input: UpdatePlatformInput): Promise<DeploymentPlatform> {
    const parsed = updatePlatformSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid platform input');
    }

    const updated = await platformRepository.update(id, {
      name: parsed.data.name,
      description: parsed.data.description || null,
      websiteUrl: parsed.data.websiteUrl || null,
      consoleUrl: parsed.data.consoleUrl || null,
      iconUrl: parsed.data.iconUrl || null,
      isActive: parsed.data.isActive,
    });
    if (!updated) throw new NotFoundError('Deployment platform not found');
    return updated;
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const ok = await platformRepository.toggleActive(id, isActive);
    if (!ok) throw new NotFoundError('Deployment platform not found');
  },
};
