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

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `backups/pre_deployment_${timestamp}.json`;
  
  const tables = ['users', 'roles', 'permissions', 'projects', 'indicators', 'activities', 'cases'];
  const backup = {};
  
  for (const table of tables) {
    const result = await pool.query(`SELECT * FROM ${table}`);
    backup[table] = result.rows;
    console.log(` Backed up ${table}: ${result.rows.length} rows`);
  }
  
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  console.log(`\n Backup created: ${filename}`);
  await pool.end();
}

backup().catch(console.error);
