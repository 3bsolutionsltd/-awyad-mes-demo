# PostgreSQL Setup Guide for AWYAD MES Migrations

## Issue: psql command not found

You're seeing this error because PostgreSQL client tools are not in your system PATH.

---

## Solution Options

### Option 1: Add PostgreSQL to PATH (Recommended)

1. **Find your PostgreSQL installation directory:**
   - Default locations:
     - `C:\Program Files\PostgreSQL\15\bin`
     - `C:\Program Files\PostgreSQL\14\bin`
     - `C:\Program Files\PostgreSQL\16\bin`

2. **Add to PATH:**
   ```powershell
   # Run PowerShell as Administrator
   # Replace version number with your PostgreSQL version
   $pgPath = "C:\Program Files\PostgreSQL\15\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$pgPath", "Machine")
   ```

3. **Restart PowerShell** and try again:
   ```powershell
   psql --version
   ```

---

### Option 2: Use pgAdmin Query Tool (Easiest)

1. Open **pgAdmin 4**
2. Connect to your database
3. Right-click on `awyad_mes` database
4. Select **Query Tool**
5. Open and run each migration file one by one:
   - `001_create_strategic_hierarchy.sql`
   - `002_update_projects.sql`
   - `003_enhance_indicators.sql`
   - ... through 009

---

### Option 3: Use Full Path to psql

```powershell
# Find your PostgreSQL bin directory first
$pgPath = "C:\Program Files\PostgreSQL\15\bin"

# Navigate to migrations
cd C:\Users\DELL\awyad-mes-demo\database\migrations

# Run migrations with full path
& "$pgPath\psql.exe" -U postgres -d awyad_mes -f run_all_migrations.sql
```

---

### Option 4: Simplified PowerShell Script (No Backup)

Use the new `run-migrations-simple.ps1` script:

```powershell
.\run-migrations-simple.ps1 -PgPath "C:\Program Files\PostgreSQL\15\bin"
```

---

## Quick Start: Running Migrations NOW

### If you have pgAdmin installed:

1. **Open pgAdmin 4**
2. **Connect to PostgreSQL server**
3. **Expand "Databases" → Right-click "awyad_mes" → Query Tool**
4. **Click File → Open** and navigate to:
   ```
   C:\Users\DELL\awyad-mes-demo\database\migrations\001_create_strategic_hierarchy.sql
   ```
5. **Click Execute (F5)**
6. **Repeat for files 002 through 009**

### If you have DBeaver installed:

1. **Open DBeaver**
2. **Connect to awyad_mes database**
3. **Click SQL Editor → New SQL Script**
4. **Click File → Open** and select migration files
5. **Execute each file in order (001 → 009)**

---

## Verification After Running Migrations

Run this query to verify tables were created:

```sql
-- Check new tables
SELECT table_name, 
       (SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE columns.table_name = tables.table_name) as columns
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN (
    'strategies', 'pillars', 'core_program_components',
    'indicator_mappings', 'activity_budget_transfers', 
    'currency_rates', 'case_types', 'case_categories',
    'monthly_snapshots', 'non_program_categories', 
    'non_program_activities', 'system_configurations',
    'role_hierarchy'
  )
ORDER BY table_name;

-- Check seeded data
SELECT 
  (SELECT COUNT(*) FROM case_types) as case_types,
  (SELECT COUNT(*) FROM non_program_categories) as non_program_cats,
  (SELECT COUNT(*) FROM currency_rates) as currency_rates,
  (SELECT COUNT(*) FROM system_configurations) as configurations;
```

**Expected Results:**
- 13 tables listed
- case_types: 5
- non_program_cats: 6  
- currency_rates: 7
- configurations: ~30+

---

## Need Help?

If you're still stuck, let me know:
1. Do you have pgAdmin installed?
2. Do you have DBeaver or another SQL client?
3. What is your PostgreSQL installation directory?

I'll create a custom solution for your setup.
