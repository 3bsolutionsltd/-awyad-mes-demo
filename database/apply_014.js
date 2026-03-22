import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'migrations', '014_schema_align.sql'), 'utf8');

const client = new Client({
  host: 'localhost', port: 5432,
  user: 'postgres', password: 'password123',
  database: 'awyad_mes',
});

try {
  await client.connect();
  console.log('Connected. Applying migration 014...');
  await client.query(sql);
  console.log('Migration 014 applied successfully!\n');

  // Verify monthly_snapshots new columns
  const snap = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'monthly_snapshots'
      AND column_name IN ('snapshot_date','total_budget','total_expenditure',
                          'total_indicators','indicators_on_track',
                          'financial_burn_rate','programmatic_performance_rate','notes')
    ORDER BY column_name
  `);
  console.log('monthly_snapshots new cols:', snap.rows.map(r => r.column_name).join(', '));

  // Verify non_program_activities new columns
  const npa = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'non_program_activities'
      AND column_name IN ('reporting_period','unit_of_measure','start_date','end_date','is_active')
    ORDER BY column_name
  `);
  console.log('non_program_activities new cols:', npa.rows.map(r => r.column_name).join(', '));

  // Verify non_program_categories new columns
  const npc = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'non_program_categories'
      AND column_name IN ('color','icon')
    ORDER BY column_name
  `);
  console.log('non_program_categories new cols:', npc.rows.map(r => r.column_name).join(', '));

  // Verify activity_funding_sources table
  const afs = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'activity_funding_sources'
    ORDER BY ordinal_position
  `);
  console.log('activity_funding_sources cols:', afs.rows.map(r => r.column_name).join(', '));

} catch (err) {
  console.error('Migration 014 failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
