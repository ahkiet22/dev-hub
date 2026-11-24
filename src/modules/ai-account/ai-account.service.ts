import 'server-only';
import { aiProviderRepository } from '@/modules/ai-provider/ai-provider.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors/app-error';
import { aiAccountRepository } from './ai-account.repository';
import type { AiAccount } from './ai-account.types';
import {
  createAiAccountSchema,
  normalizeEmail,
  type CreateAiAccountInput,
} from './ai-account.validation';

export const aiAccountService = {
  async listByUser(
    userId: string,
    filters?: { search?: string; providerId?: string }
  ): Promise<AiAccount[]> {
    return aiAccountRepository.listByUser(userId, filters);
  },

  async create(userId: string, input: CreateAiAccountInput): Promise<void> {
    const parsed = createAiAccountSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid AI account input');
    }

    const provider = await aiProviderRepository.findById(parsed.data.providerId);
    if (!provider) throw new NotFoundError('AI Provider not found');

    const email = normalizeEmail(parsed.data.email);
    const duplicate = await aiAccountRepository.existsForUser(
      userId,
      parsed.data.providerId,
      email
    );
    if (duplicate) {
      throw new ConflictError(`Email "${email}" is already registered for ${provider.name}`);
    }

    await aiAccountRepository.create({
      userId,
      providerId: parsed.data.providerId,
      email,
      note: parsed.data.note || null,
    });
  },

  async toggleActive(userId: string, id: string, isActive: boolean): Promise<void> {
    const ok = await aiAccountRepository.toggleActive(id, userId, isActive);
    if (!ok) throw new NotFoundError('AI Account not found');
  },

  async remove(userId: string, id: string): Promise<void> {
    const ok = await aiAccountRepository.deleteByIdAndUser(id, userId);
    if (!ok) throw new NotFoundError('AI Account not found');
  },
};
