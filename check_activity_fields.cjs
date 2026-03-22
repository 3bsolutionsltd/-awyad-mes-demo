const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'awyad_mes',
    password: 'postgres',
    port: 5432,
});

async function checkActivityFields() {
    try {
        const result = await pool.query(`
            SELECT * FROM activities LIMIT 1
        `);
        
        if (result.rows.length > 0) {
            const activity = result.rows[0];
            console.log('\n=== Activity Fields ===');
            console.log(Object.keys(activity));
            console.log('\n=== Sample Activity Data ===');
            console.log(JSON.stringify(activity, null, 2));
        }
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkActivityFields();
