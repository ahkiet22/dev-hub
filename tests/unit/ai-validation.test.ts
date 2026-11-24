import { describe, expect, it } from 'vitest';
import {
  createAiAccountSchema,
  normalizeEmail,
} from '@/modules/ai-account/ai-account.validation';

describe('AI Account validation and normalization', () => {
  it('normalizes email to trimmed lowercase', () => {
    expect(normalizeEmail('  User.Name@Example.COM  ')).toBe('user.name@example.com');
  });

  it('validates providerId UUID and email format', () => {
    const valid = createAiAccountSchema.safeParse({
      providerId: '11111111-1111-4111-8111-111111111111',
      email: '  Dev@Example.COM ',
      note: 'Pro account',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe('dev@example.com');
    }

    const bad = createAiAccountSchema.safeParse({
      providerId: 'not-a-uuid',
      email: 'invalid-email',
    });
    expect(bad.success).toBe(false);
  });
});
