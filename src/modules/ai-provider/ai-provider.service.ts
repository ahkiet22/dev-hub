import 'server-only';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors/app-error';
import { aiProviderRepository } from './ai-provider.repository';
import type { AiProvider } from './ai-provider.types';
import {
  createAiProviderSchema,
  type CreateAiProviderInput,
} from './ai-provider.validation';

export const aiProviderService = {
  async listAll(filters?: { onlyActive?: boolean; search?: string }): Promise<AiProvider[]> {
    return aiProviderRepository.listAll(filters);
  },

  async create(input: CreateAiProviderInput): Promise<AiProvider> {
    const parsed = createAiProviderSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid provider input');
    }

    const existing = await aiProviderRepository.findByCode(parsed.data.code);
    if (existing) {
      throw new ConflictError(`AI Provider "${parsed.data.code}" already exists`);
    }

    return aiProviderRepository.create({
      code: parsed.data.code,
      name: parsed.data.name,
      websiteUrl: parsed.data.websiteUrl,
      logoUrl: parsed.data.logoUrl || null,
      description: parsed.data.description || null,
    });
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const ok = await aiProviderRepository.toggleActive(id, isActive);
    if (!ok) throw new NotFoundError('AI Provider not found');
  },
};
