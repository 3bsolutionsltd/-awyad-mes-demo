const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function checkActivityDates() {
    try {
        // Check 2024 activities
        const result2024 = await pool.query(`
            SELECT id, activity_name, planned_date, completion_date, status
            FROM activities 
            WHERE EXTRACT(YEAR FROM planned_date) = 2024 
            ORDER BY planned_date
        `);
        
        console.log('🔍 2024 Activities:\n');
        result2024.rows.forEach((a, i) => {
            console.log(`${i + 1}. ${a.activity_name}`);
            console.log(`   Planned: ${a.planned_date}`);
            console.log(`   Status: ${a.status}`);
            console.log('');
        });
        
        // Check all activities by year
        const allYears = await pool.query(`
            SELECT 
                EXTRACT(YEAR FROM planned_date) as year,
                COUNT(*) as count,
                MIN(planned_date) as earliest,
                MAX(planned_date) as latest
            FROM activities 
            WHERE planned_date IS NOT NULL
            GROUP BY year 
            ORDER BY year
        `);
        
        console.log('\n📊 Summary by Year:\n');
        allYears.rows.forEach(row => {
            console.log(`${row.year}: ${row.count} activities (${row.earliest} to ${row.latest})`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkActivityDates();
