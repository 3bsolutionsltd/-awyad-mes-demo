const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function checkProjects() {
    const result = await pool.query(`
        SELECT 
            p.id,
            p.name,
            p.donor,
            p.budget,
            p.expenditure,
            p.thematic_area_id,
            t.name as thematic_area_name,
            t.code as thematic_area_code
        FROM projects p
        LEFT JOIN thematic_areas t ON p.thematic_area_id = t.id
        ORDER BY p.name
    `);
    
    console.log('📁 ALL PROJECTS:\n');
    result.rows.forEach(pr => {
        console.log(`- ${pr.name}`);
        console.log(`  Donor: ${pr.donor}`);
        console.log(`  Thematic Area ID: ${pr.thematic_area_id || 'NULL'}`);
        console.log(`  Thematic Area: ${pr.thematic_area_name || 'NULL'}`);
        console.log(`  Budget: $${parseFloat(pr.budget || 0).toLocaleString()}`);
        console.log(`  Expenditure: $${parseFloat(pr.expenditure || 0).toLocaleString()}`);
        console.log('');
    });
    
    await pool.end();
}

checkProjects();
