/**
 * Add Permission Management Permissions
 * Adds permissions.read and permissions.manage to the database
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const { Client } = pg;

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addPermissionManagementPermissions() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'awyad_mes',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the SQL file
    const sqlPath = join(__dirname, 'database', 'migrations', 'add_permission_management.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('\nExecuting migration...');
    await client.query(sql);
    console.log('✓ Migration executed successfully');

    // Verify the permissions were added
    console.log('\nVerifying permissions...');
    const result = await client.query(`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.description
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'permissions'
      ORDER BY r.name, p.name
    `);

    if (result.rows.length > 0) {
      console.log('\n✓ Permissions verified:');
      result.rows.forEach(row => {
        console.log(`  - ${row.role_name}: ${row.permission_name}`);
      });
    } else {
      console.log('⚠ No permissions found - something may have gone wrong');
    }

    console.log('\n✓ All done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
addPermissionManagementPermissions();
