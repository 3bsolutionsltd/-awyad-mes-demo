import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='awyad_mes',
    user='postgres',
    password='password123'
)
cursor = conn.cursor()

# Check imported indicators with their values
cursor.execute("""
    SELECT code, name, target, baseline 
    FROM indicators 
    WHERE code >= 'IND-012' 
    ORDER BY code 
    LIMIT 11
""")

print("\n📊 IMPORTED INDICATORS:")
print("="*80)
for row in cursor.fetchall():
    code, name, target, baseline = row
    print(f"{code}: {name[:60]}")
    print(f"  Target: {target} | Baseline: {baseline}")
    print()

# Check imported activities with their values
cursor.execute("""
    SELECT a.activity_name, a.target_value, a.achieved_value 
    FROM activities a
    JOIN indicators i ON a.indicator_id = i.id
    WHERE i.code >= 'IND-012'
    ORDER BY a.created_at DESC
    LIMIT 10
""")

print("\n📋 IMPORTED ACTIVITIES:")
print("="*80)
for row in cursor.fetchall():
    name, target, achieved = row
    print(f"{name[:70]}")
    print(f"  Target: {target} | Achieved: {achieved}")
    print()

conn.close()
