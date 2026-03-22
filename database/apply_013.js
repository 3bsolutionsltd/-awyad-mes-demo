import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'migrations', '013_feedback_patch.sql'), 'utf8');

const client = new Client({
  host: 'localhost', port: 5432,
  user: 'postgres', password: 'password123',
  database: 'awyad_mes',
});

try {
  await client.connect();
  console.log('Connected. Applying migration 013...');
  await client.query(sql);
  console.log('Migration 013 applied successfully!\n');

  // Verify columns
  const cols = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'organizational_indicators'
      AND column_name IN ('data_type','indicator_level')
    ORDER BY column_name
  `);
  console.log('New indicator columns:', cols.rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));

  // Verify tables
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name IN ('result_areas')
  `);
  console.log('New tables:', tables.rows.map(r => r.table_name).join(', ') || '(none)');

  // Verify roles
  const roles = await client.query(`
    SELECT name, display_name FROM roles
    WHERE name IN ('program_officer','me_coordinator','finance_manager','awyad_admin')
    ORDER BY name
  `);
  console.log('AWYAD roles:', roles.rows.map(r => r.display_name).join(', '));

  // Verify permissions mapped
  const perms = await client.query(`
    SELECT r.display_name as name, COUNT(rp.permission_id) as cnt
    FROM roles r
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    WHERE r.name IN ('program_officer','me_coordinator','finance_manager','awyad_admin','admin')
    GROUP BY r.display_name ORDER BY r.display_name
  `);
  console.log('\nRole permission counts:');
  perms.rows.forEach(r => console.log(' ', r.name, '→', r.cnt, 'permissions'));
} catch (err) {
  console.error('Migration error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
