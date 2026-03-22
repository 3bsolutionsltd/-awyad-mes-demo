// Load enhanced demo data
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'awyad_mes',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123'
});

async function loadEnhancedData() {
    try {
        console.log('Loading enhanced demo data...');
        
        const sql = fs.readFileSync(
            path.join(__dirname, 'database/seeds/006_enhanced_demo.sql'),
            'utf8'
        );
        
        await pool.query(sql);
        
        console.log('✅ Enhanced demo data loaded successfully!');
        
        // Verify
        const approved = await pool.query('SELECT COUNT(*) FROM activities WHERE approval_status = \'Approved\'');
        const jan2026 = await pool.query('SELECT COUNT(*) FROM activities WHERE date >= \'2026-01-01\' AND date < \'2026-02-01\'');
        const withBenef = await pool.query('SELECT COUNT(*) FROM activities WHERE total_beneficiaries > 0');
        
        console.log(`\n📊 Verification:`);
        console.log(`   Approved activities: ${approved.rows[0].count}`);
        console.log(`   January 2026 activities: ${jan2026.rows[0].count}`);
        console.log(`   Activities with beneficiaries: ${withBenef.rows[0].count}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

loadEnhancedData();
