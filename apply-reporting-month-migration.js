/**
 * Apply Migration 036 - Add Reporting Month to Activities
 * 
 * This script applies the database migration to add the reporting_month field.
 * 
 * Usage: node apply-reporting-month-migration.js
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

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'awyad_mes',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

async function applyMigration() {
  const client = new Client(config);

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database:', config.database);

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Check if migration already applied
    const check = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      ['036_add_reporting_month.sql']
    );

    if (check.rows.length > 0) {
      console.log('⚠️  Migration 036 has already been applied.');
      return;
    }

    // Read and apply migration
    const migrationPath = path.join(__dirname, 'database', 'migrations', '036_add_reporting_month.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('\nApplying Migration 036 - Add Reporting Month to Activities...');
    await client.query(migrationSql);

    // Record migration
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      ['036_add_reporting_month.sql']
    );

    console.log('✓ Migration 036 applied successfully!\n');
    console.log('Reporting month field has been added to the activities table.');
    console.log('You can now use the reporting_month field in activity forms and filters.\n');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
