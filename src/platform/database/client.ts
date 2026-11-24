import 'server-only';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { buildPgPoolConfig } from './config';

export type QueryClient = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

const globalForPg = globalThis as unknown as { __devHubPool?: Pool };

export function getPool(): Pool {
  if (globalForPg.__devHubPool) {
    return globalForPg.__devHubPool;
  }

  const baseConfig = buildPgPoolConfig();
  const isProd = process.env.NODE_ENV === 'production';

  const pool = new Pool({
    ...baseConfig,
    max: isProd ? 5 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  globalForPg.__devHubPool = pool;
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
  client?: QueryClient
): Promise<QueryResult<T>> {
  const target = client ?? getPool();
  return target.query<T>(sql, params);
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
  client?: QueryClient
): Promise<T | null> {
  const result = await query<T>(sql, params, client);
  return result.rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
