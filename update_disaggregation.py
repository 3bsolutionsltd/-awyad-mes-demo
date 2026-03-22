import psycopg2
import random

conn = psycopg2.connect(
    host='localhost',
    database='awyad_mes',
    user='postgres',
    password='password123'
)
cursor = conn.cursor()

print("📊 Updating activities with disaggregation data...")

# Get all activities from imported indicators
cursor.execute("""
    SELECT a.id, a.achieved_value, a.target_value, a.activity_name
    FROM activities a
    JOIN indicators i ON a.indicator_id = i.id
    WHERE i.code >= 'IND-012' AND a.achieved_value > 0
""")

activities = cursor.fetchall()
print(f"Found {len(activities)} activities with achieved values to update")

for activity_id, achieved, target, name in activities:
    if achieved == 0:
        continue
    
    # Distribute achieved value into disaggregation categories
    # Assume 60% refugee, 40% host community (typical for UNHCR programs)
    refugee_total = int(achieved * 0.6)
    host_total = achieved - refugee_total
    
    # Gender split: 55% female, 45% male (typical for protection programs)
    refugee_female = int(refugee_total * 0.55)
    refugee_male = refugee_total - refugee_female
    host_female = int(host_total * 0.55)
    host_male = host_total - host_female
    
    # Age distribution (typical for child protection/GBV programs)
    # 0-4: 15%, 5-17: 35%, 18-49: 40%, 50+: 10%
    
    # Refugee Male
    rm_0_4 = int(refugee_male * 0.15)
    rm_5_17 = int(refugee_male * 0.35)
    rm_18_49 = int(refugee_male * 0.40)
    rm_50 = refugee_male - rm_0_4 - rm_5_17 - rm_18_49
    
    # Refugee Female
    rf_0_4 = int(refugee_female * 0.15)
    rf_5_17 = int(refugee_female * 0.35)
    rf_18_49 = int(refugee_female * 0.40)
    rf_50 = refugee_female - rf_0_4 - rf_5_17 - rf_18_49
    
    # Host Male
    hm_0_4 = int(host_male * 0.15)
    hm_5_17 = int(host_male * 0.35)
    hm_18_49 = int(host_male * 0.40)
    hm_50 = host_male - hm_0_4 - hm_5_17 - hm_18_49
    
    # Host Female
    hf_0_4 = int(host_female * 0.15)
    hf_5_17 = int(host_female * 0.35)
    hf_18_49 = int(host_female * 0.40)
    hf_50 = host_female - hf_0_4 - hf_5_17 - hf_18_49
    
    # Nationality distribution (for Uganda context)
    # South Sudanese: 60%, Congolese: 30%, Sudanese: 5%, Others: 5%
    nat_ss = int(achieved * 0.60)
    nat_congo = int(achieved * 0.30)
    nat_sudan = int(achieved * 0.05)
    nat_others = achieved - nat_ss - nat_congo - nat_sudan
    
    # Update activity with all disaggregation fields
    cursor.execute("""
        UPDATE activities SET
            direct_male = %s,
            direct_female = %s,
            direct_other = 0,
            refugee_male_0_4 = %s,
            refugee_male_5_17 = %s,
            refugee_male_18_49 = %s,
            refugee_male_50_plus = %s,
            refugee_female_0_4 = %s,
            refugee_female_5_17 = %s,
            refugee_female_18_49 = %s,
            refugee_female_50_plus = %s,
            host_male_0_4 = %s,
            host_male_5_17 = %s,
            host_male_18_49 = %s,
            host_male_50_plus = %s,
            host_female_0_4 = %s,
            host_female_5_17 = %s,
            host_female_18_49 = %s,
            host_female_50_plus = %s,
            nationality_sudanese = %s,
            nationality_congolese = %s,
            nationality_south_sudanese = %s,
            nationality_others = %s
        WHERE id = %s
    """, (
        refugee_male + host_male,  # direct_male
        refugee_female + host_female,  # direct_female
        rm_0_4, rm_5_17, rm_18_49, rm_50,
        rf_0_4, rf_5_17, rf_18_49, rf_50,
        hm_0_4, hm_5_17, hm_18_49, hm_50,
        hf_0_4, hf_5_17, hf_18_49, hf_50,
        nat_sudan, nat_congo, nat_ss, nat_others,
        activity_id
    ))
    
    print(f"  ✅ Updated: {name[:60]}... (Total: {achieved}, Ref: {refugee_total}, Host: {host_total})")

conn.commit()
print(f"\n✅ Updated {len(activities)} activities with disaggregation data!")

conn.close()
