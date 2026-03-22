"""
Excel Data Import Script for AWYAD MES
Imports data from Excel files into PostgreSQL database
"""

import os
import sys
import csv
import re
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'database': 'awyad_mes',
    'user': 'postgres',
    'password': 'password123',
    'port': 5432
}

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to database successfully")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def clean_number(value):
    """Clean and convert string to number"""
    if not value or value.strip() == '' or value == '#ERROR!':
        return None
    # Remove commas, spaces, and percentage signs
    cleaned = str(value).replace(',', '').replace(' ', '').replace('%', '').strip()
    try:
        return float(cleaned)
    except:
        return None

def clean_text(value):
    """Clean text fields"""
    if not value or value.strip() == '':
        return None
    return str(value).strip()

def parse_results_framework_csv(filepath):
    """Parse the Results Framework CSV file"""
    print(f"\n📊 Parsing: {filepath}")
    
    indicators = []
    activities = []
    current_result = None
    current_indicator = None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for row in reader:
            if len(row) < 2:
                continue
                
            indicator_col = clean_text(row[0])
            activity_col = clean_text(row[1])
            
            # Check if this is a RESULT row
            if indicator_col and indicator_col.upper().startswith('RESULT'):
                current_result = indicator_col
                print(f"  📌 Found: {current_result[:60]}...")
                continue
            
            # Check if this is an Indicator row
            if indicator_col and 'indicator' in indicator_col.lower():
                current_indicator = {
                    'result': current_result,
                    'name': indicator_col,
                    'activities': []
                }
                indicators.append(current_indicator)
                print(f"    📍 Indicator: {indicator_col[:50]}...")
                
                # If there's an activity in the same row
                if activity_col:
                    target = clean_number(row[2]) if len(row) > 2 else None
                    achieved = clean_number(row[3]) if len(row) > 3 else None
                    
                    activity = {
                        'indicator': current_indicator,
                        'name': activity_col,
                        'target': target,
                        'achieved': achieved
                    }
                    current_indicator['activities'].append(activity)
                    activities.append(activity)
                continue
            
            # Regular activity row
            if activity_col and current_indicator:
                target = clean_number(row[2]) if len(row) > 2 else None
                achieved = clean_number(row[3]) if len(row) > 3 else None
                
                activity = {
                    'indicator': current_indicator,
                    'name': activity_col,
                    'target': target,
                    'achieved': achieved
                }
                current_indicator['activities'].append(activity)
                activities.append(activity)
    
    print(f"  ✅ Found {len(indicators)} indicators with {len(activities)} activities")
    return indicators, activities

def get_or_create_thematic_area(conn, result_name):
    """Get or create thematic area from RESULT"""
    cursor = conn.cursor()
    
    # Extract thematic area code from RESULT (e.g., "RESULT 2" -> "RESULT 2")
    match = re.match(r'RESULT\s*(\d+)', result_name, re.IGNORECASE)
    if match:
        code = f"RESULT {match.group(1)}"
    else:
        code = "RESULT UNKNOWN"
    
    # Clean name (take first 100 chars of description)
    name = result_name[:100] if len(result_name) > 100 else result_name
    
    # Check if exists by code OR by similar name
    cursor.execute(
        """
        SELECT id FROM thematic_areas 
        WHERE code = %s OR LOWER(name) LIKE LOWER(%s)
        LIMIT 1
        """,
        (code, f"%{name[:30]}%")
    )
    row = cursor.fetchone()
    
    if row:
        print(f"    ♻️  Using existing thematic area: {code}")
        return row[0]
    
    # Create new only if it doesn't exist
    cursor.execute(
        """
        INSERT INTO thematic_areas (code, name, description, is_active, created_at)
        VALUES (%s, %s, %s, true, NOW())
        RETURNING id
        """,
        (code, name, result_name)
    )
    thematic_id = cursor.fetchone()[0]
    conn.commit()
    print(f"    ➕ Created thematic area: {code}")
    return thematic_id

def get_default_project(conn):
    """Get or create default project for imports"""
    cursor = conn.cursor()
    
    # Try to find any existing active project first
    cursor.execute(
        """
        SELECT id, name FROM projects 
        WHERE name ILIKE '%AWYAD%' OR name ILIKE '%STEPS%'
        LIMIT 1
        """
    )
    row = cursor.fetchone()
    
    if row:
        print(f"    ♻️  Using existing project: {row[1]}")
        return row[0]
    
    # Check for exact match
    cursor.execute("SELECT id FROM projects WHERE name = 'AWYAD STEPS Program' LIMIT 1")
    row = cursor.fetchone()
    
    if row:
        return row[0]
    
    # Create default project only if none exists
    cursor.execute(
        """
        INSERT INTO projects (
            name, donor, description, status, start_date, end_date, 
            budget, is_active, created_at
        )
        VALUES (
            'AWYAD STEPS Program',
            'UNHCR',
            'STrengthening Emergency Protection Services for New Arrivals',
            'Active',
            '2024-01-01',
            '2026-12-31',
            0,
            true,
            NOW()
        )
        RETURNING id
        """
    )
    project_id = cursor.fetchone()[0]
    conn.commit()
    print(f"    ➕ Created default project: AWYAD STEPS Program")
    return project_id

def show_database_summary(conn):
    """Show current database state before import"""
    cursor = conn.cursor()
    
    print("\n📊 CURRENT DATABASE SUMMARY")
    print("-" * 60)
    
    cursor.execute("SELECT COUNT(*) FROM thematic_areas WHERE is_active = true")
    thematic_count = cursor.fetchone()[0]
    print(f"   Thematic Areas: {thematic_count}")
    
    cursor.execute("SELECT COUNT(*) FROM projects WHERE is_active = true")
    projects_count = cursor.fetchone()[0]
    print(f"   Projects: {projects_count}")
    
    cursor.execute("SELECT COUNT(*) FROM indicators WHERE is_active = true")
    indicators_count = cursor.fetchone()[0]
    print(f"   Indicators: {indicators_count}")
    
    cursor.execute("SELECT COUNT(*) FROM activities")
    activities_count = cursor.fetchone()[0]
    print(f"   Activities: {activities_count}")
    
    cursor.execute("SELECT COUNT(*) FROM cases")
    cases_count = cursor.fetchone()[0]
    print(f"   Cases: {cases_count}")
    
    print("-" * 60)
    
    if thematic_count > 0:
        print("\n📌 Existing Thematic Areas:")
        cursor.execute("SELECT code, name FROM thematic_areas WHERE is_active = true ORDER BY code")
        for row in cursor.fetchall():
            print(f"   • {row[0]}: {row[1][:50]}")
    
    if projects_count > 0:
        print("\n📁 Existing Projects:")
        cursor.execute("SELECT name FROM projects WHERE is_active = true LIMIT 5")
        for row in cursor.fetchall():
            print(f"   • {row[0]}")

def import_results_framework(conn, filepath):
    """Import Results Framework data"""
    print("\n" + "="*60)
    print("📥 IMPORTING RESULTS FRAMEWORK")
    print("="*60)
    
    indicators_data, activities_data = parse_results_framework_csv(filepath)
    
    if not indicators_data:
        print("⚠️  No data found to import")
        return
    
    cursor = conn.cursor()
    project_id = get_default_project(conn)
    
    indicators_imported = 0
    activities_imported = 0
    indicators_skipped = 0
    activities_skipped = 0
    
    for indicator_info in indicators_data:
        try:
            # Get or create thematic area
            thematic_area_id = get_or_create_thematic_area(conn, indicator_info['result'])
            
            # Check if indicator already exists (by name similarity)
            indicator_name = indicator_info['name'][:255]
            cursor.execute(
                """
                SELECT id FROM indicators 
                WHERE thematic_area_id = %s 
                AND (name = %s OR LOWER(name) LIKE LOWER(%s))
                LIMIT 1
                """,
                (thematic_area_id, indicator_name, f"%{indicator_name[:50]}%")
            )
            existing_indicator = cursor.fetchone()
            
            if existing_indicator:
                indicator_id = existing_indicator[0]
                indicators_skipped += 1
                print(f"    ♻️  Skipping existing indicator: {indicator_name[:60]}...")
            else:
                # Generate unique code for indicator
                cursor.execute("SELECT COUNT(*) FROM indicators")
                count = cursor.fetchone()[0]
                indicator_code = f"IND-{count + 1:03d}"
                
                # Calculate total target from activities
                total_target = sum(int(act['target']) if act['target'] else 0 for act in indicator_info['activities'])
                total_achieved = sum(int(act['achieved']) if act['achieved'] else 0 for act in indicator_info['activities'])
                
                # Create indicator
                cursor.execute(
                    """
                    INSERT INTO indicators (
                        code, name, description, type, thematic_area_id,
                        target, achieved, unit, reporting_frequency,
                        baseline, is_active, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, NOW())
                    RETURNING id
                    """,
                    (
                        indicator_code,
                        indicator_name,
                        indicator_info['result'],
                        'Outcome',
                        thematic_area_id,
                        total_target,
                        total_achieved,
                        'Count',
                        'Quarterly',
                        0
                    )
                )
                indicator_id = cursor.fetchone()[0]
                indicators_imported += 1
                print(f"    ➕ Created indicator: {indicator_name[:60]}...")
            
            # Import activities for this indicator
            for activity in indicator_info['activities']:
                activity_name = activity['name'][:500]
                
                # Check if activity already exists
                cursor.execute(
                    """
                    SELECT id FROM activities 
                    WHERE indicator_id = %s 
                    AND (activity_name = %s OR LOWER(activity_name) LIKE LOWER(%s))
                    LIMIT 1
                    """,
                    (indicator_id, activity_name, f"%{activity_name[:50]}%")
                )
                
                if cursor.fetchone():
                    activities_skipped += 1
                    continue
                
                # Create new activity
                target_val = int(activity['target']) if activity['target'] else 0
                achieved_val = int(activity['achieved']) if activity['achieved'] else 0
                
                cursor.execute(
                    """
                    INSERT INTO activities (
                        project_id, thematic_area_id, indicator_id,
                        activity_name, description, status, location,
                        planned_date, budget, actual_cost,
                        target_value, achieved_value,
                        direct_male, direct_female, direct_other,
                        created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        project_id,
                        thematic_area_id,
                        indicator_id,
                        activity_name,
                        f"Target: {activity['target']}, Achieved: {activity['achieved']}",
                        'Completed' if achieved_val > 0 else 'Planned',
                        'Uganda',
                        '2024-01-01',
                        0,
                        0,
                        target_val,
                        achieved_val,
                        achieved_val,  # Put achieved in direct_male for now
                        0,
                        0
                    )
                )
                activities_imported += 1
            
            conn.commit()
            
        except Exception as e:
            print(f"    ⚠️  Error importing indicator: {str(e)[:100]}")
            conn.rollback()
            continue
    
    print(f"\n✅ Import complete!")
    print(f"   • Indicators imported: {indicators_imported}")
    print(f"   • Indicators skipped (already exist): {indicators_skipped}")
    print(f"   • Activities imported: {activities_imported}")
    print(f"   • Activities skipped (already exist): {activities_skipped}")

def main():
    """Main import function"""
    print("\n" + "="*60)
    print("🚀 AWYAD MES DATA IMPORT TOOL")
    print("="*60)
    
    # Connect to database
    conn = connect_db()
    
    # File paths
    files = {
        'results_framework': 'data/imports/AWYAD - STEPS - RESULTS BASED FRAMEWORK - Summary Dashboard.csv'
    }
    
    # Check files exist
    for name, filepath in files.items():
        if not os.path.exists(filepath):
            print(f"⚠️  File not found: {filepath}")
            return
    
    try:
        # Show current database state
        show_database_summary(conn)
        
        # Import Results Framework
        import_results_framework(conn, files['results_framework'])
        
        print("\n" + "="*60)
        print("✅ ALL IMPORTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n🔌 Database connection closed")

if __name__ == '__main__':
    main()
