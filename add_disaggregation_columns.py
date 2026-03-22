import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='awyad_mes',
    user='postgres',
    password='password123'
)
cursor = conn.cursor()

print("📦 Adding disaggregation columns to activities table...")

# Add refugee disaggregation columns
disagg_columns = [
    # Refugee male by age
    "refugee_male_0_4 INTEGER DEFAULT 0",
    "refugee_male_5_17 INTEGER DEFAULT 0",
    "refugee_male_18_49 INTEGER DEFAULT 0",
    "refugee_male_50_plus INTEGER DEFAULT 0",
    
    # Refugee female by age
    "refugee_female_0_4 INTEGER DEFAULT 0",
    "refugee_female_5_17 INTEGER DEFAULT 0",
    "refugee_female_18_49 INTEGER DEFAULT 0",
    "refugee_female_50_plus INTEGER DEFAULT 0",
    
    # Host community male by age
    "host_male_0_4 INTEGER DEFAULT 0",
    "host_male_5_17 INTEGER DEFAULT 0",
    "host_male_18_49 INTEGER DEFAULT 0",
    "host_male_50_plus INTEGER DEFAULT 0",
    
    # Host community female by age
    "host_female_0_4 INTEGER DEFAULT 0",
    "host_female_5_17 INTEGER DEFAULT 0",
    "host_female_18_49 INTEGER DEFAULT 0",
    "host_female_50_plus INTEGER DEFAULT 0",
    
    # Nationality
    "nationality_sudanese INTEGER DEFAULT 0",
    "nationality_congolese INTEGER DEFAULT 0",
    "nationality_south_sudanese INTEGER DEFAULT 0",
    "nationality_others INTEGER DEFAULT 0"
]

for col in disagg_columns:
    col_name = col.split()[0]
    try:
        cursor.execute(f"ALTER TABLE activities ADD COLUMN IF NOT EXISTS {col}")
        print(f"  ✅ Added {col_name}")
    except Exception as e:
        print(f"  ⚠️  {col_name}: {str(e)[:50]}")

conn.commit()
print("\n✅ Disaggregation columns added successfully!")

conn.close()
