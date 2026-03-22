# Quick Start Guide: Running Database Migrations

## ⚡ Fastest Method: Use pgAdmin (Recommended)

**If you have pgAdmin installed, this is the easiest approach:**

### Step-by-Step:

1. **Open pgAdmin 4**

2. **Connect to your PostgreSQL server**
   - Expand "Servers" in left panel
   - Enter password if prompted

3. **Open Query Tool**
   - Right-click on `awyad_mes` database
   - Select "Query Tool"

4. **Run migrations one by one:**
   - Click **File → Open**
   - Navigate to: `C:\Users\DELL\awyad-mes-demo\database\migrations\`
   - Select `001_create_strategic_hierarchy.sql`
   - Click **Execute** (or press F5)
   - Wait for "Query returned successfully"
   - Repeat for files 002 through 009 **in order**

5. **Verify success:**
   - Open a new Query Tool
   - Paste and run:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('strategies', 'pillars', 'core_program_components')
   ORDER BY table_name;
   ```
   - Should see 3 tables listed

---

## Alternative Methods

### Method 1: Batch File (Auto-finds PostgreSQL)

```batch
# Double-click this file:
run-migrations.bat
```

The batch file will:
- Auto-detect PostgreSQL installation
- Prompt for password
- Run all migrations
- Show results

### Method 2: Simple PowerShell (Specify PostgreSQL path)

```powershell
# Find your PostgreSQL installation first
# Common locations:
# C:\Program Files\PostgreSQL\15\bin
# C:\Program Files\PostgreSQL\14\bin

.\run-migrations-simple.ps1 -PgPath "C:\Program Files\PostgreSQL\15\bin"
```

### Method 3: Manual psql with full path

```powershell
# Replace XX with your PostgreSQL version (13, 14, 15, 16, etc.)
cd database\migrations
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d awyad_mes -f run_all_migrations.sql
```

---

## 🔍 Don't know your PostgreSQL version?

Run this in PowerShell:

```powershell
Get-ChildItem "C:\Program Files\PostgreSQL\" -Directory | Select-Object Name
```

Or check these folders:
- `C:\Program Files\PostgreSQL\`
- `C:\Program Files (x86)\PostgreSQL\`

---

## 📋 Migration Order (Important!)

Migrations MUST run in this order:
1. 001_create_strategic_hierarchy.sql
2. 002_update_projects.sql
3. 003_enhance_indicators.sql
4. 004_enhance_activities.sql
5. 005_overhaul_cases.sql
6. 006_monthly_snapshots.sql
7. 007_non_program_activities.sql
8. 008_system_configurations.sql
9. 009_enhanced_roles.sql

**Using `run_all_migrations.sql` handles this automatically!**

---

## ✅ Verification After Running

Run this query to check everything worked:

```sql
-- Should return 13 tables
SELECT COUNT(*) as new_tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'strategies', 'pillars', 'core_program_components',
  'indicator_mappings', 'activity_budget_transfers', 
  'currency_rates', 'case_types', 'case_categories',
  'monthly_snapshots', 'non_program_categories', 
  'non_program_activities', 'system_configurations',
  'role_hierarchy'
);

-- Check seed data was inserted
SELECT 
  (SELECT COUNT(*) FROM case_types) as case_types_count,
  (SELECT COUNT(*) FROM non_program_categories) as non_program_cats_count,
  (SELECT COUNT(*) FROM currency_rates) as currency_rates_count,
  (SELECT COUNT(*) FROM system_configurations) as configurations_count;
```

**Expected results:**
- new_tables_created: 13
- case_types_count: 5
- non_program_cats_count: 6
- currency_rates_count: 7
- configurations_count: 30+

---

## ⚠️ If Something Goes Wrong

**To rollback all changes:**

Using pgAdmin:
1. Open Query Tool on awyad_mes database
2. Open and run: `rollback_all_migrations.sql`

Using command line:
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d awyad_mes -f rollback_all_migrations.sql
```

---

## 🆘 Still Having Issues?

**Share these details:**
1. Do you have pgAdmin installed? (Yes/No)
2. What is your PostgreSQL version?
3. What error message do you see?

I'll provide a custom solution!

---

## 📞 Next Steps After Success

Once migrations complete successfully:

1. ✅ Verify with queries above
2. ✅ Test database connection from application
3. ✅ Update IMPLEMENTATION_TASKS.md (mark Task 2.1 complete)
4. ⏳ Begin API route development (Tasks 2.2-2.9)

**See PHASE1_WEEK1_COMPLETE.md for full details!**
