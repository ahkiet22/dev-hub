import 'dotenv/config';
import { healthService } from '@/modules/health/health.service';
import { getPool } from '@/platform/database/client';
import { getEnv } from '@/platform/env';
import { logger } from '@/platform/logger';

const POLL_INTERVAL_MS = 10_000;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

async function startWorker() {
  const env = getEnv();
  const activeLocks = new Set<string>();
  let shuttingDown = false;
  let lastCleanupAt = 0;

  logger.info('Dev Hub health worker started', {
    pollIntervalMs: POLL_INTERVAL_MS,
    retentionDays: env.HEALTH_RETENTION_DAYS,
  });

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Health worker shutting down', { signal });
    await getPool().end();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  while (!shuttingDown) {
    try {
      const res = await healthService.runBatchDueChecks(20, 5, activeLocks);
      if (res.checked > 0 || res.failed > 0) {
        logger.info('Health batch completed', res);
      }

      if (Date.now() - lastCleanupAt > CLEANUP_INTERVAL_MS) {
        const purged = await healthService.cleanupOldChecks(env.HEALTH_RETENTION_DAYS);
        lastCleanupAt = Date.now();
        if (purged > 0) {
          logger.info('Health history cleanup completed', { purged });
        }
      }
    } catch (err) {
      logger.error('Health worker loop error', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

startWorker().catch((err) => {
  console.error('Fatal worker error:', err);
  process.exit(1);
});
