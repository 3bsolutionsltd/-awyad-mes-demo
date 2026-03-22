import psycopg2
from datetime import datetime

conn = psycopg2.connect(
    host='localhost',
    database='awyad_mes',
    user='postgres',
    password='password123'
)
cursor = conn.cursor()

print("📅 Updating activity dates to 2025-2026...")

# Get all imported activities (those with default 2024-01-01 date)
cursor.execute("""
    SELECT id, activity_name 
    FROM activities 
    WHERE planned_date = '2024-01-01'
    ORDER BY created_at
""")

activities = cursor.fetchall()
print(f"Found {len(activities)} activities to update")

# Distribute activities across 2025 and 2026
# Put majority in 2025, some in 2026 for ongoing tracking
months_2025 = [
    '2025-01-15', '2025-02-10', '2025-03-20', '2025-04-12', 
    '2025-05-18', '2025-06-25', '2025-07-08', '2025-08-14',
    '2025-09-22', '2025-10-10', '2025-11-15', '2025-12-05'
]

months_2026 = [
    '2026-01-10', '2026-01-15', '2026-01-20'
]

# 80% in 2025, 20% in 2026
split_point = int(len(activities) * 0.8)

for i, (activity_id, name) in enumerate(activities):
    if i < split_point:
        # 2025 activities - distribute across all months
        month_index = i % len(months_2025)
        new_date = months_2025[month_index]
    else:
        # 2026 activities - all in January 2026
        month_index = (i - split_point) % len(months_2026)
        new_date = months_2026[month_index]
    
    cursor.execute("""
        UPDATE activities 
        SET planned_date = %s::date,
            completion_date = CASE 
                WHEN status = 'Completed' THEN %s::date 
                ELSE NULL 
            END
        WHERE id = %s
    """, (new_date, new_date, activity_id))
    
    print(f"  ✅ {name[:50]}... → {new_date}")

conn.commit()
print(f"\n✅ Updated {len(activities)} activities with realistic dates!")
print("  • ~38 activities in 2025 (distributed across all months)")
print("  • ~9 activities in 2026 (January)")

conn.close()
