"""
Import GBV Case Management data into the cases table
Generates realistic case data based on GBV program activities
"""

import psycopg2
import os
from datetime import datetime, timedelta
import random

# Database connection
password = os.environ.get('DB_PASSWORD', 'password123')

try:
    conn = psycopg2.connect(
        dbname='awyad_mes',
        user='postgres',
        password=password,
        host='localhost',
        port=5432
    )
    cur = conn.cursor()
    
    # GBV case types and locations from the program data
    case_types = [
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
    ]
    
    locations = [
        'Nakivale Settlement',
        'Bidibidi Settlement',
        'Kampala Urban',
        'Kyaka II Settlement',
        'Rhino Camp Settlement',
        'Palabek Settlement',
        'Imvepi Settlement',
        'Kiryandongo Settlement'
    ]
    
    statuses = ['Open', 'Closed', 'Follow-up Required', 'Referred']
    
    # Check existing cases
    cur.execute('SELECT COUNT(*) FROM cases')
    existing_count = cur.fetchone()[0]
    print(f'📊 Existing cases in database: {existing_count}')
    
    # Generate realistic case data for 2025-2026
    cases_to_import = []
    
    # Target: Import 50 cases distributed across 2025-2026
    num_cases = 50
    
    # Generate cases with realistic dates
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 1, 20)
    
    for i in range(num_cases):
        # Random date between start and end
        days_diff = (end_date - start_date).days
        random_days = random.randint(0, days_diff)
        case_date = start_date + timedelta(days=random_days)
        
        # Follow-up date 2-4 weeks after report
        follow_up_days = random.randint(14, 28)
        follow_up_date = case_date + timedelta(days=follow_up_days)
        
        # Determine status based on date
        if case_date < datetime(2025, 11, 1):
            status = random.choice(['Closed', 'Closed', 'Follow-up Required'])  # Older cases mostly closed
        else:
            status = random.choice(['Open', 'Follow-up Required', 'Referred'])  # Recent cases still active
        
        case = {
            'location': random.choice(locations),
            'date_reported': case_date.strftime('%Y-%m-%d'),
            'service_provided': random.choice(case_types),
            'status': status,
            'notes': f'Case managed under {random.choice(case_types)} program. Client receiving comprehensive support.',
            'follow_up_date': follow_up_date.strftime('%Y-%m-%d') if status != 'Closed' else None
        }
        
        cases_to_import.append(case)
    
    # Sort by date
    cases_to_import.sort(key=lambda x: x['date_reported'])
    
    print(f'\n🔄 Importing {len(cases_to_import)} cases...\n')
    
    # Insert cases
    imported = 0
    for case in cases_to_import:
        try:
            cur.execute('''
                INSERT INTO cases (location, date_reported, service_provided, status, notes, follow_up_date)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                case['location'],
                case['date_reported'],
                case['service_provided'],
                case['status'],
                case['notes'],
                case['follow_up_date']
            ))
            
            case_id = cur.fetchone()[0]
            imported += 1
            
            # Print every 10th case
            if imported % 10 == 0:
                print(f'✅ Imported {imported}/{len(cases_to_import)} cases...')
        
        except psycopg2.IntegrityError as e:
            print(f'⚠️  Skipped duplicate case')
            conn.rollback()
            continue
    
    conn.commit()
    
    print(f'\n✅ Successfully imported {imported} cases!')
    
    # Show summary statistics
    cur.execute('''
        SELECT 
            status,
            COUNT(*) as count
        FROM cases
        GROUP BY status
        ORDER BY count DESC
    ''')
    
    print('\n📊 Case Status Summary:')
    print('=' * 40)
    for row in cur.fetchall():
        print(f'   {row[0]}: {row[1]} cases')
    
    # Show date range
    cur.execute('''
        SELECT 
            MIN(date_reported) as earliest,
            MAX(date_reported) as latest,
            COUNT(*) as total
        FROM cases
    ''')
    
    result = cur.fetchone()
    print(f'\n📅 Date Range:')
    print(f'   Earliest: {result[0]}')
    print(f'   Latest: {result[1]}')
    print(f'   Total Cases: {result[2]}')
    
    # Show by location
    cur.execute('''
        SELECT 
            location,
            COUNT(*) as count
        FROM cases
        GROUP BY location
        ORDER BY count DESC
        LIMIT 5
    ''')
    
    print(f'\n📍 Top 5 Locations:')
    print('=' * 40)
    for row in cur.fetchall():
        print(f'   {row[0]}: {row[1]} cases')
    
    conn.close()
    
    print('\n🎉 Case import complete!')
    print('\n💡 Refresh your browser to see the new cases in Case Management')

except psycopg2.OperationalError as e:
    print(f'❌ Database connection error: {e}')
    print('\n💡 Make sure PostgreSQL is running and the password is correct')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
