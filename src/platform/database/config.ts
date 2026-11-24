import type { PoolConfig } from 'pg';
import { getEnv } from '@/platform/env';

export function getDatabaseSchema(): string {
  return getEnv().DATABASE_SCHEMA;
}

export function buildPgPoolConfig(): PoolConfig {
  const env = getEnv();
  const ssl =
    env.DATABASE_SSLMODE === 'disable'
      ? false
      : {
          rejectUnauthorized:
            env.DATABASE_SSLMODE === 'verify-full' ||
            env.DATABASE_SSLMODE === 'verify-ca',
        };

  if (env.DATABASE_URL?.trim()) {
    return {
      connectionString: env.DATABASE_URL.trim(),
      ssl,
    };
  }

  return {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl,
  };
}
