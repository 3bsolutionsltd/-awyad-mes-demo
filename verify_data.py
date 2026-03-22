"""Quick script to verify imported data"""
import psycopg2

DB_CONFIG = {
    'host': 'localhost',
    'database': 'awyad_mes',
    'user': 'postgres',
    'password': 'password123',
    'port': 5432
}

conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

print("\n📊 DATABASE VERIFICATION")
print("="*60)

# Count indicators
cursor.execute("SELECT COUNT(*) FROM indicators WHERE is_active = true")
print(f"✅ Indicators (active): {cursor.fetchone()[0]}")

# Count activities
cursor.execute("SELECT COUNT(*) FROM activities")
print(f"✅ Activities: {cursor.fetchone()[0]}")

# Count cases
cursor.execute("SELECT COUNT(*) FROM cases")
print(f"✅ Cases: {cursor.fetchone()[0]}")

# Sample indicator
cursor.execute("SELECT code, name FROM indicators ORDER BY created_at DESC LIMIT 3")
print(f"\n📌 Recent Indicators:")
for row in cursor.fetchall():
    print(f"   {row[0]}: {row[1][:60]}...")

# Sample activity
cursor.execute("SELECT activity_name FROM activities ORDER BY created_at DESC LIMIT 3")
print(f"\n📌 Recent Activities:")
for row in cursor.fetchall():
    print(f"   {row[0][:60]}...")

# Check case fields
cursor.execute("SELECT case_number, client_name, client_gender, status FROM cases LIMIT 2")
print(f"\n📌 Sample Cases:")
for row in cursor.fetchall():
    print(f"   Case: {row[0]} | Client: {row[1]} | Gender: {row[2]} | Status: {row[3]}")

conn.close()
print("\n" + "="*60)
