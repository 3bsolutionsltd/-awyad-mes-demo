/**
 * Database Setup and Migration Script
 * 
 * This script creates database, runs schema, and seeds initial data.
 * Run with: node database/setup.js
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

// Database configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'awyad_mes';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (result.rowCount === 0) {
      console.log(`📦 Creating database: ${DB_NAME}...`);
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database ${DB_NAME} created successfully`);
    } else {
      console.log(`ℹ️  Database ${DB_NAME} already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Run SQL script file
 */
async function runSQLScript(client, scriptPath, description) {
  try {
    console.log(`\n📜 Running ${description}...`);
    const sql = fs.readFileSync(scriptPath, 'utf8');
    await client.query(sql);
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running ${description}:`, error.message);
    throw error;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('🚀 Starting database setup...\n');

  // Step 1: Create database
  await createDatabase();

  // Step 2: Connect to the new database
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    await client.connect();
    console.log(`\n✅ Connected to database: ${DB_NAME}`);

    // Step 3: Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    await runSQLScript(client, schemaPath, 'Database Schema');

    // Step 4: Run seed data
    const seedPath = path.join(__dirname, 'seeds', '001_initial_data.sql');
    await runSQLScript(client, seedPath, 'Initial Data Seeding');

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📝 Default admin credentials:');
    console.log('   Email: admin@awyad.org');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change the default admin password immediately!\n');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Verify database connection
 */
async function verify() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    await client.connect();
    console.log('\n🔍 Verifying database setup...');

    // Check tables
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n✅ Tables created: ${tableCheck.rowCount}`);
    tableCheck.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check roles
    const roleCheck = await client.query('SELECT COUNT(*) as count FROM roles');
    console.log(`\n✅ Roles seeded: ${roleCheck.rows[0].count}`);

    // Check permissions
    const permCheck = await client.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`✅ Permissions seeded: ${permCheck.rows[0].count}`);

    // Check admin user
    const userCheck = await client.query(
      "SELECT email FROM users WHERE email = 'admin@awyad.org'"
    );
    console.log(`✅ Admin user created: ${userCheck.rowCount > 0 ? 'Yes' : 'No'}`);

    console.log('\n✅ Database verification completed!\n');
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  } finally {
    await client.end();
  }
}

/**
 * Reset database (drop and recreate)
 */
async function reset() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('⚠️  WARNING: This will delete all data!');

    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [DB_NAME]);

    // Drop database
    console.log(`\n🗑️  Dropping database: ${DB_NAME}...`);
    await client.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    console.log(`✅ Database dropped successfully`);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// CLI interface
const command = process.argv[2];

(async () => {
  try {
    if (command === 'reset') {
      await reset();
      await setup();
    } else if (command === 'verify') {
      await verify();
    } else {
      await setup();
    }
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();
