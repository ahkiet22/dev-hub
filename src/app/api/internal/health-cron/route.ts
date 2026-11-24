import { NextRequest, NextResponse } from 'next/server';
import { healthService } from '@/modules/health/health.service';
import { getEnv } from '@/platform/env';
import { logger } from '@/platform/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const env = getEnv();
  const cronSecret = env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await healthService.runBatchDueChecks(20, 5);
    const purged = await healthService.cleanupOldChecks(env.HEALTH_RETENTION_DAYS);

    logger.info('Health cron completed', { ...result, purged });
    return NextResponse.json({ ok: true, ...result, purged });
  } catch (err) {
    logger.error('Health cron failed', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
