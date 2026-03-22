const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function checkBeneficiaries() {
    const result = await pool.query(`
        SELECT 
            activity_name, 
            planned_date, 
            direct_male, 
            direct_female, 
            indirect_male, 
            indirect_female,
            (direct_male + direct_female + indirect_male + indirect_female) as total
        FROM activities 
        ORDER BY planned_date DESC
        LIMIT 10
    `);
    
    console.log('📊 Sample Activities with Beneficiaries:\n');
    result.rows.forEach(a => {
        console.log(`- ${a.activity_name.substring(0, 50)}...`);
        console.log(`  Date: ${a.planned_date}`);
        console.log(`  Direct M/F: ${a.direct_male}/${a.direct_female}`);
        console.log(`  Indirect M/F: ${a.indirect_male}/${a.indirect_female}`);
        console.log(`  Total: ${a.total}\n`);
    });
    
    await pool.end();
}

checkBeneficiaries();
