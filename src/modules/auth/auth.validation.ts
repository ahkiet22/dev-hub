import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or username is required')
    .max(255),
  password: z.string().min(1, 'Password is required').max(256),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().max(120).optional().nullable(),
  avatarUrl: z
    .string()
    .trim()
    .url('Avatar URL must be a valid URL')
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(256),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
