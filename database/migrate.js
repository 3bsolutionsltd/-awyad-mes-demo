/**
 * Database Migration Runner
 * 
 * Applies all pending SQL migrations from database/migrations/ in order.
 * Tracks applied migrations in a `schema_migrations` table.
 * 
 * Usage:
 *   node database/migrate.js          — run all pending migrations
 *   node database/migrate.js status   — list which migrations have been applied
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'awyad_mes',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const res = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return new Set(res.rows.map(r => r.filename));
}

async function runMigrations() {
  const mode = process.argv[2] || 'run';

  const client = new Client(config);
  try {
    await client.connect();
    console.log(`✅ Connected to ${config.database}@${config.host}`);

    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // lexicographic order → 001, 002, …, 018

    if (mode === 'status') {
      console.log('\nMigration status:');
      for (const file of files) {
        const status = applied.has(file) ? '✅ applied ' : '⏳ pending ';
        console.log(`  ${status} ${file}`);
      }
      console.log(`\n${applied.size}/${files.length} migrations applied.\n`);
      return;
    }

    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('✅ All migrations are already applied. Nothing to do.');
      return;
    }

    console.log(`\nApplying ${pending.length} pending migration(s)…\n`);

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      process.stdout.write(`  ▶ ${file} … `);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log('done');
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('FAILED');
        console.error(`\n❌ Migration failed: ${file}`);
        console.error(err.message);
        process.exit(1);
      }
    }

    console.log(`\n✅ ${pending.length} migration(s) applied successfully.\n`);
  } finally {
    await client.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration runner error:', err.message);
  process.exit(1);
});
