import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function verifyColumn() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    
    // Check if reporting_month column exists
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'reporting_month'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ reporting_month column exists:');
      console.log(result.rows[0]);
    } else {
      console.log('✗ reporting_month column NOT found');
    }
    
    // Check if index exists
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'activities' AND indexname = 'idx_activities_reporting_month'
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('✓ idx_activities_reporting_month index exists');
    } else {
      console.log('✗ Index NOT found');
    }
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyColumn();
