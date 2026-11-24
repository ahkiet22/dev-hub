'use server';

import { revalidatePath } from 'next/cache';
import { authService } from '@/modules/auth/auth.service';
import { healthService } from './health.service';

export async function runManualHealthCheckAction(backendId: string): Promise<void> {
  const { user } = await authService.requireSession();
  await healthService.runManualCheck(user.id, backendId);
  revalidatePath(`/backends/${backendId}`);
  revalidatePath('/backends');
}
