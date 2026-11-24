import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { classifyHealthResponse } from '@/modules/health/health.contract';
import {
  isPrivateOrReservedIp,
  validateSsrfTarget,
} from '@/platform/http/ssrf-safe-fetch';

describe('Health contract classification', () => {
  it('classifies HTTP 200 healthy and degraded responses', () => {
    const healthy = classifyHealthResponse(
      200,
      JSON.stringify({
        status: 'healthy',
        service: 'ticket-api',
        version: '1.0.0',
        timestamp: '2026-11-25T00:00:00Z',
        checks: { database: { status: 'healthy' } },
      })
    );
    expect(healthy.status).toBe('HEALTHY');
    expect(healthy.errorMessage).toBeNull();

    const degraded = classifyHealthResponse(
      200,
      JSON.stringify({
        status: 'degraded',
        service: 'ticket-api',
        timestamp: '2026-11-25T00:00:00Z',
      })
    );
    expect(degraded.status).toBe('DEGRADED');
  });

  it('classifies HTTP 503 unhealthy and catches status mismatches', () => {
    const unhealthy = classifyHealthResponse(
      503,
      JSON.stringify({
        status: 'unhealthy',
        service: 'ticket-api',
        timestamp: '2026-11-25T00:00:00Z',
      })
    );
    expect(unhealthy.status).toBe('UNHEALTHY');

    const mismatch = classifyHealthResponse(
      200,
      JSON.stringify({
        status: 'unhealthy',
        service: 'ticket-api',
        timestamp: '2026-11-25T00:00:00Z',
      })
    );
    expect(mismatch.status).toBe('INVALID_RESPONSE');
  });

  it('classifies malformed JSON as INVALID_RESPONSE', () => {
    const invalid = classifyHealthResponse(200, 'not-json');
    expect(invalid.status).toBe('INVALID_RESPONSE');
  });
});

describe('SSRF protection', () => {
  it('detects private, loopback, link-local, and metadata IPs', () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('10.0.0.5')).toBe(true);
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('192.168.1.10')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIp('::1')).toBe(true);
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
  });

  it('blocks non-HTTP protocols and direct private IPs', async () => {
    await expect(validateSsrfTarget('file:///etc/passwd')).rejects.toThrow();
    await expect(validateSsrfTarget('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(validateSsrfTarget('http://127.0.0.1:8080/health')).rejects.toThrow();
  });
});
