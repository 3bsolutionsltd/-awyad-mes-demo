import psycopg2
import os

# Try to connect with environment variable or default
password = os.environ.get('DB_PASSWORD', 'postgres')

try:
    conn = psycopg2.connect(
        dbname='awyad_mes',
        user='postgres',
        password=password,
        host='localhost',
        port=5432
    )
    
    cur = conn.cursor()
    
    # Get total count
    cur.execute('SELECT COUNT(*) FROM cases')
    total = cur.fetchone()[0]
    print(f'📊 Total Cases in Database: {total}\n')
    
    # Get case details
    cur.execute('''
        SELECT id, location, date_reported, service_provided, status, 
               notes, follow_up_date, created_at
        FROM cases 
        ORDER BY date_reported DESC
    ''')
    
    cases = cur.fetchall()
    
    print('Case Details:')
    print('=' * 80)
    for i, case in enumerate(cases, 1):
        print(f'\n{i}. Case ID: {case[0]}')
        print(f'   📍 Location: {case[1]}')
        print(f'   📅 Date Reported: {case[2]}')
        print(f'   🏥 Service Provided: {case[3]}')
        print(f'   ⚡ Status: {case[4]}')
        print(f'   📝 Notes: {case[5][:50] if case[5] else "None"}...')
        print(f'   🔄 Follow-up Date: {case[6]}')
        print(f'   🕒 Created: {case[7]}')
    
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f'❌ Connection Error: {e}')
    print('\n💡 Try setting DB_PASSWORD environment variable or checking server is running')
