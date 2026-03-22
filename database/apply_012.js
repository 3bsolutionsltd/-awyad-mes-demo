import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'migrations', '012_rbm_schema.sql'), 'utf8');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password123',
  database: 'awyad_mes',
});

try {
  await client.connect();
  console.log('Connected. Applying migration 012...');
  await client.query(sql);
  console.log('Migration 012 applied successfully!');

  const result = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public'
     AND table_name IN ('organizational_indicators','project_indicators','indicator_values','activity_indicators','validation_audit_log')
     ORDER BY table_name`
  );
  console.log('RBM tables now exist:', result.rows.map(r => r.table_name).join(', '));
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
