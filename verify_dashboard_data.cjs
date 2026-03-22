const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function verifyDashboardData() {
    try {
        console.log('🔍 DASHBOARD DATA VERIFICATION\n');
        console.log('='.repeat(60) + '\n');
        
        // 1. Projects count
        const projectsResult = await pool.query('SELECT COUNT(*) as count FROM projects');
        const projectsCount = parseInt(projectsResult.rows[0].count);
        console.log('📁 PROJECTS:');
        console.log(`   Total: ${projectsCount}`);
        
        // Get project details
        const projectDetails = await pool.query(`
            SELECT name, donor, budget, 
                   COALESCE(budget, 0) as budget_val,
                   0 as expenditure_val
            FROM projects 
            LIMIT 5
        `);
        console.log('   Sample Projects:');
        projectDetails.rows.forEach(p => {
            console.log(`   - ${p.name} (${p.donor}) - Budget: $${p.budget_val}`);
        });
        console.log('');
        
        // 2. Indicators count and on-track
        const indicatorsResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN (achieved::float / NULLIF(target, 0) * 100) >= 70 THEN 1 END) as on_track
            FROM indicators
            WHERE is_active = true
        `);
        console.log('📊 INDICATORS:');
        console.log(`   Total: ${indicatorsResult.rows[0].total}`);
        console.log(`   On-Track (≥70%): ${indicatorsResult.rows[0].on_track}`);
        
        // Get sample indicators
        const indicatorDetails = await pool.query(`
            SELECT code, name, target, achieved,
                   CASE 
                       WHEN target > 0 THEN ROUND((achieved::float / target * 100)::numeric, 1)
                       ELSE 0 
                   END as percent_achieved
            FROM indicators
            WHERE is_active = true
            ORDER BY achieved DESC
            LIMIT 5
        `);
        console.log('   Top Performing Indicators:');
        indicatorDetails.rows.forEach(i => {
            console.log(`   - ${i.code}: ${i.achieved}/${i.target} (${i.percent_achieved}%)`);
        });
        console.log('');
        
        // 3. Activities this month (January 2026)
        const activitiesThisMonth = await pool.query(`
            SELECT COUNT(*) as count
            FROM activities
            WHERE EXTRACT(MONTH FROM planned_date) = 1
            AND EXTRACT(YEAR FROM planned_date) = 2026
        `);
        
        const activitiesTotal = await pool.query('SELECT COUNT(*) as count FROM activities');
        
        console.log('📅 ACTIVITIES:');
        console.log(`   This Month (Jan 2026): ${activitiesThisMonth.rows[0].count}`);
        console.log(`   Total Activities: ${activitiesTotal.rows[0].count}`);
        
        // Activities by year
        const activitiesByYear = await pool.query(`
            SELECT 
                EXTRACT(YEAR FROM planned_date) as year,
                COUNT(*) as count
            FROM activities
            WHERE planned_date IS NOT NULL
            GROUP BY year
            ORDER BY year
        `);
        console.log('   By Year:');
        activitiesByYear.rows.forEach(y => {
            console.log(`   - ${y.year}: ${y.count} activities`);
        });
        console.log('');
        
        // 4. Budget and burn rate
        const budgetResult = await pool.query(`
            SELECT 
                COALESCE(SUM(budget), 0) as total_budget,
                COALESCE(SUM(0), 0) as total_expenditure
            FROM projects
        `);
        
        const totalBudget = parseFloat(budgetResult.rows[0].total_budget);
        const totalExpenditure = parseFloat(budgetResult.rows[0].total_expenditure);
        const burnRate = totalBudget > 0 ? (totalExpenditure / totalBudget * 100) : 0;
        
        console.log('💰 BUDGET:');
        console.log(`   Total Budget: $${totalBudget.toLocaleString()}`);
        console.log(`   Total Expenditure: $${totalExpenditure.toLocaleString()}`);
        console.log(`   Burn Rate: ${burnRate.toFixed(1)}%`);
        console.log('');
        
        // 5. Cases
        const casesResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_cases,
                COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_cases
            FROM cases
        `);
        
        console.log('📋 CASES:');
        console.log(`   Total: ${casesResult.rows[0].total}`);
        console.log(`   Open: ${casesResult.rows[0].open_cases}`);
        console.log(`   Closed: ${casesResult.rows[0].closed_cases}`);
        console.log('');
        
        // 6. Thematic Areas
        const thematicAreas = await pool.query(`
            SELECT DISTINCT 
                t.id,
                t.name,
                t.code,
                (SELECT COUNT(*) FROM indicators WHERE thematic_area_id = t.id) as indicator_count,
                (SELECT COUNT(*) FROM projects WHERE thematic_area_id = t.id) as project_count
            FROM thematic_areas t
            WHERE t.is_active = true
            ORDER BY t.name
        `);
        
        console.log('🎯 THEMATIC AREAS:');
        thematicAreas.rows.forEach(ta => {
            console.log(`   - ${ta.name}`);
            console.log(`     Projects: ${ta.project_count}, Indicators: ${ta.indicator_count}`);
        });
        console.log('');
        
        console.log('='.repeat(60));
        console.log('✅ Dashboard data verification complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

verifyDashboardData();
