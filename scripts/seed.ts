import 'dotenv/config';
import { hash } from '@node-rs/argon2';
import { Pool } from 'pg';
import {
  buildPgPoolConfig,
  getDatabaseSchema,
} from '../src/platform/database/config';

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const username = (process.env.SEED_ADMIN_USERNAME ?? '').trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  const fullName = process.env.SEED_ADMIN_FULL_NAME?.trim() || 'Dev Hub Admin';

  if (!email || !username || password.length < 8) {
    throw new Error(
      'SEED_ADMIN_EMAIL, SEED_ADMIN_USERNAME, and SEED_ADMIN_PASSWORD (min 8 chars) must be set in environment.'
    );
  }

  const schema = getDatabaseSchema();
  const pool = new Pool(buildPgPoolConfig());

  try {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM "${schema}".users WHERE (email = $1 OR username = $2) AND deleted_at IS NULL LIMIT 1`,
      [email, username]
    );

    if (existing.rows.length > 0) {
      console.log(`[seed] admin user already exists (${email}). Skipping.`);
      return;
    }

    const passwordHash = await hash(password, {
      algorithm: 2, // Argon2id
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await pool.query(
      `INSERT INTO "${schema}".users (email, username, password_hash, full_name)
       VALUES ($1, $2, $3, $4)`,
      [email, username, passwordHash, fullName]
    );

    console.log(`[seed] created initial admin user: ${email} (${username})`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
