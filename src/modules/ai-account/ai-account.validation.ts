import { z } from 'zod';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const createAiAccountSchema = z.object({
  providerId: z.string().uuid('Invalid AI provider'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Valid email address is required')
    .max(255),
  note: z.string().trim().max(500).optional().nullable(),
});

export type CreateAiAccountInput = z.infer<typeof createAiAccountSchema>;
