import 'server-only';
import { backendRepository } from '@/modules/backend/backend.repository';
import type { HealthStatus } from '@/modules/backend/backend.types';
import { withTransaction } from '@/platform/database/client';
import { ssrfSafeGet } from '@/platform/http/ssrf-safe-fetch';
import { logger } from '@/platform/logger';
import { NotFoundError } from '@/shared/errors/app-error';
import { classifyHealthResponse, type HealthResponsePayload } from './health.contract';
import { healthRepository, type DueBackendTarget } from './health.repository';
import type { BackendHealthCheck } from './health.types';

async function executeSingleTarget(target: DueBackendTarget): Promise<BackendHealthCheck> {
  let status: HealthStatus = 'UNREACHABLE';
  let httpStatusCode: number | null = null;
  let responseTimeMs: number | null = null;
  let responseBody: HealthResponsePayload | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await ssrfSafeGet(target.healthUrl, target.timeoutMs);
    httpStatusCode = res.httpStatus;
    responseTimeMs = res.durationMs;

    const classified = classifyHealthResponse(res.httpStatus, res.bodyText);
    status = classified.status;
    responseBody = classified.payload;
    errorMessage = classified.errorMessage;
  } catch (err) {
    status = 'UNREACHABLE';
    errorMessage = err instanceof Error ? err.message : 'Network error';
  }

  return withTransaction(async (client) =>
    healthRepository.recordCheckResult(
      {
        backendId: target.id,
        status,
        httpStatusCode,
        responseTimeMs,
        responseBody,
        errorMessage,
      },
      client
    )
  );
}

export const healthService = {
  async runManualCheck(userId: string, backendId: string): Promise<BackendHealthCheck> {
    const backend = await backendRepository.findByIdAndUser(backendId, userId);
    if (!backend) throw new NotFoundError('Backend not found');

    return executeSingleTarget({
      id: backend.id,
      healthUrl: backend.healthUrl,
      timeoutMs: backend.timeoutMs,
    });
  },

  async getHistory(
    userId: string,
    backendId: string,
    limit = 50
  ): Promise<BackendHealthCheck[]> {
    const backend = await backendRepository.findByIdAndUser(backendId, userId);
    if (!backend) throw new NotFoundError('Backend not found');
    return healthRepository.listByBackendAndUser(backendId, userId, limit);
  },

  async runBatchDueChecks(
    limit = 20,
    concurrency = 5,
    activeLocks?: Set<string>
  ): Promise<{ checked: number; failed: number }> {
    const due = await healthRepository.findDueBackends(limit);
    const targets = activeLocks
      ? due.filter((d) => !activeLocks.has(d.id))
      : due;

    if (targets.length === 0) return { checked: 0, failed: 0 };

    let checked = 0;
    let failed = 0;
    let index = 0;

    async function workerLoop() {
      while (index < targets.length) {
        const current = targets[index++];
        if (!current) continue;
        activeLocks?.add(current.id);
        try {
          await executeSingleTarget(current);
          checked++;
        } catch (err) {
          failed++;
          logger.error('Health check execution failed', {
            backendId: current.id,
            error: err instanceof Error ? err.message : 'unknown',
          });
        } finally {
          activeLocks?.delete(current.id);
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, targets.length) },
      () => workerLoop()
    );
    await Promise.all(workers);

    return { checked, failed };
  },

  async cleanupOldChecks(retentionDays = 30): Promise<number> {
    return healthRepository.deleteOlderThanDays(retentionDays);
  },
};
