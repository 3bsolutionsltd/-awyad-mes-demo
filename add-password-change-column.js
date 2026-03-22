/**
 * Add require_password_change column to users table
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'awyad_mes',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function addColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding require_password_change column...');
    console.log('');
    
    // Check if column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'require_password_change'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✓ Column already exists!');
    } else {
      // Add the column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN require_password_change BOOLEAN DEFAULT FALSE
      `);
      
      console.log('✅ Column added successfully!');
    }
    
    // Verify
    const verify = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'require_password_change'
    `);
    
    console.log('');
    console.log('Column details:');
    console.log(verify.rows[0]);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addColumn().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
