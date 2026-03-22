const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function checkCaseData() {
    try {
        const result = await pool.query(`
            SELECT case_number, case_type, date_reported, closure_date, 
                   service_provided, status, location, follow_up_date
            FROM cases 
            ORDER BY date_reported DESC
            LIMIT 5
        `);
        
        console.log('📊 Sample Case Data from Database:\n');
        result.rows.forEach((row, i) => {
            console.log(`Case ${i + 1}:`);
            console.log(`  Case Number: ${row.case_number}`);
            console.log(`  Case Type: ${row.case_type}`);
            console.log(`  Date Reported: ${row.date_reported}`);
            console.log(`  Closure Date: ${row.closure_date}`);
            console.log(`  Service Provided: ${row.service_provided}`);
            console.log(`  Status: ${row.status}`);
            console.log(`  Location: ${row.location}`);
            console.log(`  Follow-up Date: ${row.follow_up_date}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkCaseData();
