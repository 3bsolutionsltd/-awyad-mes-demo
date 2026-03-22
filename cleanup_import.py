import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='awyad_mes',
    user='postgres',
    password='password123'
)
cursor = conn.cursor()

print("🗑️  Deleting previously imported data...")

# Delete activities from imported indicators
cursor.execute("""
    DELETE FROM activities 
    WHERE indicator_id IN (
        SELECT id FROM indicators WHERE code >= 'IND-012'
    )
""")
deleted_activities = cursor.rowcount
print(f"   Deleted {deleted_activities} activities")

# Delete imported indicators
cursor.execute("""
    DELETE FROM indicators WHERE code >= 'IND-012'
""")
deleted_indicators = cursor.rowcount
print(f"   Deleted {deleted_indicators} indicators")

conn.commit()
print("\n✅ Cleanup complete! Ready for re-import.")

conn.close()
