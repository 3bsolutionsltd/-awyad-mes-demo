const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function checkYears() {
    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(YEAR FROM planned_date) as year, 
                COUNT(*) as count 
            FROM activities 
            WHERE planned_date IS NOT NULL 
            GROUP BY year 
            ORDER BY year
        `);
        
        console.log('📅 Years with Activities in Database:\n');
        result.rows.forEach(row => {
            console.log(`  ${row.year}: ${row.count} activities`);
        });
        
        console.log(`\n✅ Total unique years: ${result.rows.length}`);
        console.log('\n💡 The Monthly Tracking tabs show these exact years dynamically.');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkYears();
