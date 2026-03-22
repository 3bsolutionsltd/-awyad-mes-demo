import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function verify() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'awyad_mes',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if user exists
    const userResult = await client.query(
      "SELECT id, email, username, password_hash, is_active FROM users WHERE email = 'admin@awyad.org'"
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Admin user NOT found in database!');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Admin user found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Active:', user.is_active);
    console.log('   Hash:', user.password_hash.substring(0, 20) + '...\n');

    // Test password
    const testPassword = 'Admin@123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    if (isValid) {
      console.log('✅ Password "Admin@123" is VALID!');
    } else {
      console.log('❌ Password "Admin@123" is INVALID!');
      console.log('\nGenerating new hash for "Admin@123"...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('New hash:', newHash);
      console.log('\nUpdating user password...');
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [newHash, 'admin@awyad.org']
      );
      console.log('✅ Password updated! Try logging in again.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
