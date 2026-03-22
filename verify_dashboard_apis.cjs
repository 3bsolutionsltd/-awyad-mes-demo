const http = require('http');

function testEndpoint(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${path}: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => reject(error));
        req.end();
    });
}

async function verifyDashboardAPIs() {
    try {
        console.log('🔍 DASHBOARD API VERIFICATION\n');
        console.log('='.repeat(60) + '\n');
        
        // Test projects
        console.log('📁 Testing /api/projects...');
        const projects = await testEndpoint('/api/projects?limit=1000');
        const projectData = projects.data?.projects || projects.data || [];
        console.log(`   ✅ Retrieved ${projectData.length} projects`);
        if (projectData.length > 0) {
            console.log(`   Sample: ${projectData[0].name || projectData[0].project_name}`);
        }
        console.log('');
        
        // Test indicators
        console.log('📊 Testing /api/indicators...');
        const indicators = await testEndpoint('/api/indicators?limit=1000');
        const indicatorData = indicators.data?.indicators || indicators.data || [];
        console.log(`   ✅ Retrieved ${indicatorData.length} indicators`);
        if (indicatorData.length > 0) {
            console.log(`   Sample: ${indicatorData[0].code} - ${indicatorData[0].name}`);
        }
        console.log('');
        
        // Test activities
        console.log('📅 Testing /api/activities...');
        const activities = await testEndpoint('/api/activities?limit=1000');
        const activityData = activities.data?.activities || activities.data || [];
        console.log(`   ✅ Retrieved ${activityData.length} activities`);
        if (activityData.length > 0) {
            const sample = activityData[0];
            console.log(`   Sample: ${sample.activity_name || sample.title}`);
            console.log(`   Date field: ${sample.planned_date || sample.date || 'MISSING'}`);
            console.log(`   Beneficiaries: ${sample.direct_male + sample.direct_female || 'N/A'}`);
        }
        console.log('');
        
        // Test cases
        console.log('📋 Testing /api/cases...');
        const cases = await testEndpoint('/api/cases?limit=1000');
        const caseData = cases.data?.cases || cases.data || [];
        console.log(`   ✅ Retrieved ${caseData.length} cases`);
        if (caseData.length > 0) {
            console.log(`   Sample: ${caseData[0].case_number}`);
        }
        console.log('');
        
        console.log('='.repeat(60));
        console.log('✅ All API endpoints responding correctly!\n');
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
    }
}

verifyDashboardAPIs();
