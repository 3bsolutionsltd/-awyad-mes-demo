const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

async function checkExpenditure() {
    // Check projects
    const projects = await pool.query(`
        SELECT name, 
               COALESCE(budget, 0) as budget, 
               COALESCE(expenditure, 0) as exp 
        FROM projects
    `);
    
    console.log('📁 PROJECTS EXPENDITURE:');
    let totalProjectBudget = 0;
    let totalProjectExp = 0;
    projects.rows.forEach(p => {
        totalProjectBudget += parseFloat(p.budget);
        totalProjectExp += parseFloat(p.exp);
        console.log(`- ${p.name}`);
        console.log(`  Budget: $${parseFloat(p.budget).toLocaleString()}`);
        console.log(`  Expenditure: $${parseFloat(p.exp).toLocaleString()}`);
    });
    console.log(`\nTotal Project Budget: $${totalProjectBudget.toLocaleString()}`);
    console.log(`Total Project Expenditure: $${totalProjectExp.toLocaleString()}\n`);
    
    // Check activities
    const activities = await pool.query(`
        SELECT 
            SUM(COALESCE(budget, 0)) as total_budget,
            SUM(COALESCE(actual_cost, 0)) as total_spent
        FROM activities
    `);
    
    console.log('📅 ACTIVITIES EXPENDITURE:');
    console.log(`Total Activities Budget: $${parseFloat(activities.rows[0].total_budget).toLocaleString()}`);
    console.log(`Total Activities Spent: $${parseFloat(activities.rows[0].total_spent).toLocaleString()}\n`);
    
    // Combined
    const combinedBudget = totalProjectBudget;
    const combinedSpent = parseFloat(activities.rows[0].total_spent);
    const burnRate = combinedBudget > 0 ? (combinedSpent / combinedBudget * 100) : 0;
    
    console.log('🔥 BURN RATE CALCULATION:');
    console.log(`Budget: $${combinedBudget.toLocaleString()} (from projects)`);
    console.log(`Spent: $${combinedSpent.toLocaleString()} (from activities)`);
    console.log(`Burn Rate: ${burnRate.toFixed(1)}%`);
    console.log(`\nThis matches what dashboard is showing: ${burnRate.toFixed(1)}% = $${combinedSpent.toLocaleString()} / $${combinedBudget.toLocaleString()}`);
    
    await pool.end();
}

checkExpenditure();
