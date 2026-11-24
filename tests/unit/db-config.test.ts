import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPgPoolConfig,
  getDatabaseSchema,
} from '@/platform/database/config';
import { getEnv } from '@/platform/env';

describe('database configuration builder', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    getEnv({ reload: true });
  });

  it('builds config from individual DATABASE_* variables via getEnv()', () => {
    delete process.env.DATABASE_URL;
    process.env.DATABASE_HOST = 'db.internal';
    process.env.DATABASE_PORT = '5433';
    process.env.DATABASE_USER = 'admin';
    process.env.DATABASE_PASSWORD = 'secret';
    process.env.DATABASE_NAME = 'devhub_db';
    process.env.DATABASE_SSLMODE = 'disable';
    process.env.DATABASE_SCHEMA = 'dev-hub';
    getEnv({ reload: true });

    const cfg = buildPgPoolConfig();
    expect(cfg.host).toBe('db.internal');
    expect(cfg.port).toBe(5433);
    expect(cfg.user).toBe('admin');
    expect(cfg.password).toBe('secret');
    expect(cfg.database).toBe('devhub_db');
    expect(cfg.ssl).toBe(false);
    expect(getDatabaseSchema()).toBe('dev-hub');
  });

  it('enables SSL when DATABASE_SSLMODE=require', () => {
    delete process.env.DATABASE_URL;
    process.env.DATABASE_SSLMODE = 'require';
    getEnv({ reload: true });

    const cfg = buildPgPoolConfig();
    expect(cfg.ssl).toEqual({ rejectUnauthorized: false });
  });
});
