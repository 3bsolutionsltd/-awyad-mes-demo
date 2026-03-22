import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='awyad_mes',
    user='postgres',
    password='password123'
)
cursor = conn.cursor()

print("📦 Running migration: add_target_achieved_tracking")

# Add columns to activities
cursor.execute("""
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 0;
""")
print("✅ Added target_value to activities")

cursor.execute("""
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS achieved_value INTEGER DEFAULT 0;
""")
print("✅ Added achieved_value to activities")

# Add achieved column to indicators
cursor.execute("""
    ALTER TABLE indicators ADD COLUMN IF NOT EXISTS achieved INTEGER DEFAULT 0;
""")
print("✅ Added achieved to indicators")

conn.commit()
print("\n✅ Migration completed successfully!")

conn.close()
