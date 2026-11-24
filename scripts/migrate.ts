import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import {
  buildPgPoolConfig,
  getDatabaseSchema,
} from '../src/platform/database/config';

const MIGRATIONS_DIR = path.resolve(
  process.cwd(),
  'src/platform/database/migrations'
);

async function ensureMigrationsTable(pool: Pool, schema: string) {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schema}".schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function listUpMigrations(): Promise<string[]> {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith('.up.sql'))
    .map((f) => f.replace(/\.up\.sql$/, ''))
    .sort();
}

async function runUp(pool: Pool, schema: string) {
  const versions = await listUpMigrations();
  const appliedRes = await pool.query<{ version: string }>(
    `SELECT version FROM "${schema}".schema_migrations ORDER BY version ASC`
  );
  const applied = new Set(appliedRes.rows.map((r) => r.version));

  let count = 0;
  for (const version of versions) {
    if (applied.has(version)) {
      console.log(`[migrate:up] skipping already applied: ${version}`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, `${version}.up.sql`);
    const sql = await fs.readFile(sqlPath, 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO "${schema}".schema_migrations (version) VALUES ($1)`,
        [version]
      );
      await client.query('COMMIT');
      console.log(`[migrate:up] applied: ${version}`);
      count++;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  console.log(`[migrate:up] done (${count} applied).`);
}

async function runDown(pool: Pool, schema: string, steps: number) {
  const appliedRes = await pool.query<{ version: string }>(
    `SELECT version FROM "${schema}".schema_migrations ORDER BY version DESC LIMIT $1`,
    [steps]
  );

  if (appliedRes.rows.length === 0) {
    console.log('[migrate:down] no applied migrations to roll back.');
    return;
  }

  for (const row of appliedRes.rows) {
    const downPath = path.join(MIGRATIONS_DIR, `${row.version}.down.sql`);
    let sql: string;
    try {
      sql = await fs.readFile(downPath, 'utf8');
    } catch {
      throw new Error(`Missing down migration file: ${downPath}`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `DELETE FROM "${schema}".schema_migrations WHERE version = $1`,
        [row.version]
      );
      await client.query('COMMIT');
      console.log(`[migrate:down] rolled back: ${row.version}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function runStatus(pool: Pool, schema: string) {
  const versions = await listUpMigrations();
  const appliedRes = await pool.query<{ version: string; applied_at: Date }>(
    `SELECT version, applied_at FROM "${schema}".schema_migrations ORDER BY version ASC`
  );
  const appliedMap = new Map(
    appliedRes.rows.map((r) => [r.version, r.applied_at])
  );

  for (const version of versions) {
    const appliedAt = appliedMap.get(version);
    if (appliedAt) {
      console.log(`[APPLIED] ${version} (${appliedAt.toISOString()})`);
    } else {
      console.log(`[PENDING] ${version}`);
    }
  }
}

async function main() {
  const command = (process.argv[2] ?? 'up').toLowerCase();
  const stepsArg = Number(process.argv[3] ?? 1);
  const steps = Number.isInteger(stepsArg) && stepsArg > 0 ? stepsArg : 1;

  const schema = getDatabaseSchema();
  const pool = new Pool(buildPgPoolConfig());

  try {
    await ensureMigrationsTable(pool, schema);

    if (command === 'up') {
      await runUp(pool, schema);
    } else if (command === 'down') {
      await runDown(pool, schema, steps);
    } else if (command === 'status') {
      await runStatus(pool, schema);
    } else {
      throw new Error(`Unknown command "${command}". Use: up | down [steps] | status`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
