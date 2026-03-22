const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkAdminAndBackup() {
  try {
    console.log('\n🔍 Checking Admin User...\n');
    
    // Check admin user
    const adminResult = await pool.query(
      'SELECT username, email, full_name FROM users WHERE username = $1',
      ['admin']
    );
    
    if (adminResult.rows.length > 0) {
      console.log('✅ ADMIN USER FOUND:');
      console.log('==================');
      console.log('Username:', adminResult.rows[0].username);
      console.log('Email:', adminResult.rows[0].email);
      console.log('Full Name:', adminResult.rows[0].full_name || 'System Administrator');
      console.log('\n⚠️  Password: Check your seed script (likely "Admin123!" or "password")');
      console.log('   Try logging in with: admin / Admin123!');
    } else {
      console.log('❌ No admin user found');
    }
    
    console.log('\n📦 Creating Database Backup...\n');
    
    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `backups/pre_deployment_${timestamp}.json`;
    
    const tables = ['users', 'roles', 'permissions', 'projects', 'indicators', 'activities', 'cases'];
    const backup = {
      created_at: new Date().toISOString(),
      database: process.env.DB_NAME,
      tables: {}
    };
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        backup.tables[table] = result.rows;
        console.log(`✅ Backed up ${table}: ${result.rows.length} rows`);
      } catch (err) {
        console.log(`⚠️  Skipped ${table}: ${err.message}`);
      }
    }
    
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    console.log(`\n✅ Backup created: ${filename}`);
    console.log(`📊 Backup size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdminAndBackup();
