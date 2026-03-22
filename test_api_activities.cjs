const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/activities',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const activities = JSON.parse(data);
            
            console.log(`📊 Total activities from API: ${activities.length}\n`);
            
            // Group by year
            const byYear = {};
            activities.forEach(activity => {
                const date = activity.date || activity.planned_date || activity.plannedDate;
                if (date) {
                    const year = new Date(date).getFullYear();
                    if (!byYear[year]) byYear[year] = [];
                    byYear[year].push(activity);
                }
            });
            
            console.log('📅 Activities by Year:\n');
            Object.keys(byYear).sort().forEach(year => {
                console.log(`${year}: ${byYear[year].length} activities`);
            });
            
            // Check if 2024 activities have the date field
            if (byYear[2024]) {
                console.log('\n🔍 Sample 2024 Activity:');
                const sample = byYear[2024][0];
                console.log('Fields:', Object.keys(sample));
                console.log('date:', sample.date);
                console.log('planned_date:', sample.planned_date);
                console.log('plannedDate:', sample.plannedDate);
            }
            
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Response:', data.substring(0, 200));
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
