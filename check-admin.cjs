const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkAdmin() {
  try {
    console.log('\n🔍 Checking Admin User Credentials...\n');
    
    // First, check what columns exist in users table
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Users Table Columns:', columnsResult.rows.map(r => r.column_name).join(', '));
    console.log('');
    
    // Query admin user with only the known columns
    const adminResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      ['admin']
    );
    
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log('✅ ADMIN USER FOUND!');
      console.log('===================');
      console.log('Username:', admin.username || 'Not found');
      console.log('Email:', admin.email || 'Not set');
      console.log('ID:', admin.id || admin.user_id);
      console.log('');
      console.log('🔑 PASSWORDS TO TRY:');
      console.log('   1. Admin123!');
      console.log('   2. password');
      console.log('   3. admin123');
      console.log('   4. admin');
      console.log('');
      console.log('🌐 LOGIN URL:');
      console.log('   http://localhost:3001/public/login.html');
      console.log('');
    } else {
      console.log('❌ No admin user found!');
      console.log('Creating admin user might be needed...');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
