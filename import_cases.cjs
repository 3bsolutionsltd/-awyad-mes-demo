/**
 * Import GBV Case Management Data
 * Generates realistic case data based on GBV program activities
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'awyad_mes',
    user: 'postgres',
    password: 'password123'
});

// GBV case types and locations from the program data
const caseTypes = [
    'GBV Case Management',
    'Psychosocial Support',
    'Legal Support',
    'Medical Referral',
    'Child Protection',
    'Sexual Exploitation and Abuse (SEA)',
    'Case Conferencing',
    'Multi-sectoral Support',
    'PEP Access Support',
    'Safe House Accommodation'
];

const locations = [
    'Nakivale Settlement',
    'Bidibidi Settlement',
    'Kampala Urban',
    'Kyaka II Settlement',
    'Rhino Camp Settlement',
    'Palabek Settlement',
    'Imvepi Settlement',
    'Kiryandongo Settlement'
];

const statuses = ['Open', 'Closed', 'Follow-up Required', 'Referred'];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

async function importCases() {
    try {
        // Check existing cases
        const existingResult = await pool.query('SELECT COUNT(*) FROM cases');
        const existingCount = parseInt(existingResult.rows[0].count);
        console.log(`📊 Existing cases in database: ${existingCount}`);
        
        const cases = [];
        const numCases = 50;
        
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2026-01-20');
        
        // Generate cases
        for (let i = 0; i < numCases; i++) {
            const caseDate = randomDate(startDate, endDate);
            const followUpDays = 14 + Math.floor(Math.random() * 14);
            const followUpDate = addDays(caseDate, followUpDays);
            
            let status;
            if (caseDate < new Date('2025-11-01')) {
                status = ['Closed', 'Closed', 'Follow-up Required'][Math.floor(Math.random() * 3)];
            } else {
                status = statuses[Math.floor(Math.random() * statuses.length)];
            }
            
            const serviceType = caseTypes[Math.floor(Math.random() * caseTypes.length)];
            
            cases.push({
                location: locations[Math.floor(Math.random() * locations.length)],
                date_reported: formatDate(caseDate),
                service_provided: serviceType,
                status: status,
                notes: `Case managed under ${serviceType} program. Client receiving comprehensive support.`,
                follow_up_date: status !== 'Closed' ? formatDate(followUpDate) : null
            });
        }
        
        // Sort by date
        cases.sort((a, b) => new Date(a.date_reported) - new Date(b.date_reported));
        
        console.log(`\n🔄 Importing ${cases.length} cases...\n`);
        
        // Get the last case number to continue sequence
        const lastCaseResult = await pool.query(`
            SELECT case_number FROM cases 
            WHERE case_number ~ '^GBV-[0-9]+$'
            ORDER BY CAST(SUBSTRING(case_number FROM 5) AS INTEGER) DESC 
            LIMIT 1
        `);
        
        let caseCounter = 1;
        if (lastCaseResult.rows.length > 0) {
            const lastNumber = lastCaseResult.rows[0].case_number;
            caseCounter = parseInt(lastNumber.split('-')[1]) + 1;
        }
        
        let imported = 0;
        for (const caseData of cases) {
            try {
                const caseNumber = `GBV-${String(caseCounter).padStart(4, '0')}`;
                caseCounter++;
                
                await pool.query(`
                    INSERT INTO cases (
                        case_number, date_reported, case_type, severity, status, 
                        location, service_provided, notes, follow_up_date
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    caseNumber,
                    caseData.date_reported,
                    caseData.service_provided,
                    'Medium',  // Default severity
                    caseData.status,
                    caseData.location,
                    caseData.service_provided,
                    caseData.notes,
                    caseData.follow_up_date
                ]);
                
                imported++;
                if (imported % 10 === 0) {
                    console.log(`✅ Imported ${imported}/${cases.length} cases...`);
                }
            } catch (error) {
                console.log(`⚠️  Skipped duplicate case`);
            }
        }
        
        console.log(`\n✅ Successfully imported ${imported} cases!`);
        
        // Show summary statistics
        const statusResult = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM cases
            GROUP BY status
            ORDER BY count DESC
        `);
        
        console.log('\n📊 Case Status Summary:');
        console.log('========================================');
        statusResult.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count} cases`);
        });
        
        // Show date range
        const rangeResult = await pool.query(`
            SELECT 
                MIN(date_reported) as earliest,
                MAX(date_reported) as latest,
                COUNT(*) as total
            FROM cases
        `);
        
        const range = rangeResult.rows[0];
        console.log(`\n📅 Date Range:`);
        console.log(`   Earliest: ${range.earliest}`);
        console.log(`   Latest: ${range.latest}`);
        console.log(`   Total Cases: ${range.total}`);
        
        // Show by location
        const locationResult = await pool.query(`
            SELECT location, COUNT(*) as count
            FROM cases
            GROUP BY location
            ORDER BY count DESC
            LIMIT 5
        `);
        
        console.log(`\n📍 Top 5 Locations:`);
        console.log('========================================');
        locationResult.rows.forEach(row => {
            console.log(`   ${row.location}: ${row.count} cases`);
        });
        
        console.log('\n🎉 Case import complete!');
        console.log('\n💡 Refresh your browser to see the new cases in Case Management');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

importCases();
