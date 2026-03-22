# Migration Execution - Issues & Fixes Log

**Date:** January 22, 2026  
**Session:** First Migration Execution Attempt  
**Status:** In Progress - Fixing Issues

---

## Summary

During the initial execution of Phase 1 Week 1 database migrations, we encountered several issues that required fixes to the migration files. This document tracks all issues found and solutions applied.

---

## Issues Encountered & Fixes Applied

### Issue 1: PostgreSQL Client (psql) Not in PATH
**Error:**
```
psql : The term 'psql' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

**Root Cause:**
PostgreSQL bin directory not added to Windows PATH environment variable.

**Solutions Provided:**
1. ✅ Created `POSTGRESQL_SETUP_GUIDE.md` - Instructions to add psql to PATH
2. ✅ Created `run-migrations.bat` - Auto-detects PostgreSQL installation
3. ✅ Created `run-migrations-simple.ps1` - Accepts PostgreSQL path as parameter
4. ✅ Created `MIGRATION_QUICKSTART.md` - Multiple execution methods including pgAdmin

**Recommended Approach:** Use pgAdmin Query Tool (easiest for Windows users)

---

### Issue 2: PowerShell Script Syntax Error
**Error:**
```
ERROR: too few parameters specified for RAISE
The Try statement is missing its Catch or Finally block.
```

**File:** `run-migrations.ps1`

**Root Cause:**
Malformed try-catch block and missing error suppression for pg_dump command.

**Fix Applied:**
Changed line 54 from:
```powershell
pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $backupPath
```

To:
```powershell
pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $backupPath 2>&1 | Out-Null
```

**Status:** ✅ Fixed in `run-migrations.ps1`

---

### Issue 3: Invalid RAISE WARNING Syntax in 003_enhance_indicators.sql
**Error:**
```
ERROR:  too few parameters specified for RAISE
CONTEXT:  compilation of PL/pgSQL function "validate_indicator_scope" near line 16
SQL state: 42601
```

**File:** `database/migrations/003_enhance_indicators.sql`  
**Line:** 115

**Root Cause:**
PostgreSQL RAISE statement with `%` character in message string requires a format parameter.

**Original Code:**
```sql
IF NEW.data_type = 'percentage' AND NEW.achieved > 100 THEN
    RAISE WARNING 'Percentage value exceeds 100%';
END IF;
```

**Fix Applied:**
```sql
IF NEW.data_type = 'percentage' AND NEW.achieved > 100 THEN
    RAISE WARNING 'Percentage value exceeds 100 percent: %', NEW.achieved;
END IF;
```

**Explanation:**
In PostgreSQL PL/pgSQL, `%` is a format placeholder. Must either:
- Remove `%` from string, OR
- Provide format parameter after comma

**Status:** ✅ Fixed in `003_enhance_indicators.sql`

---

### Issue 4: Cannot Drop Column with Dependent View in 004_enhance_activities.sql
**Error:**
```
ERROR:  cannot drop column total_beneficiaries of table activities because other objects depend on it
Detail: view activity_summary_view depends on column total_beneficiaries of table activities
Hint: Use DROP ... CASCADE to drop the dependent objects too.
SQL state: 2BP01
```

**File:** `database/migrations/004_enhance_activities.sql`  
**Line:** 49

**Root Cause:**
Attempting to drop `total_beneficiaries` column that has a dependent view (`activity_summary_view`).

**Original Code:**
```sql
ALTER TABLE activities DROP COLUMN IF EXISTS total_beneficiaries;
```

**Fix Applied:**
```sql
-- First, drop dependent views if they exist
DROP VIEW IF EXISTS activity_summary_view CASCADE;

-- Drop the old generated column if it exists
ALTER TABLE activities DROP COLUMN IF EXISTS total_beneficiaries CASCADE;

-- Recreate with comprehensive calculation
ALTER TABLE activities ADD COLUMN total_beneficiaries INTEGER GENERATED ALWAYS AS (
    age_0_4_male + age_0_4_female + age_0_4_other +
    age_5_17_male + age_5_17_female + age_5_17_other +
    age_18_49_male + age_18_49_female + age_18_49_other +
    age_50_plus_male + age_50_plus_female + age_50_plus_other
) STORED;

-- Recreate the activity summary view
CREATE OR REPLACE VIEW activity_summary_view AS
[view definition]
```

**Status:** ✅ Fixed in `004_enhance_activities.sql`

---

### Issue 5: Non-existent Column in View Definition
**Error:**
```
ERROR:  column a.expenditure does not exist
LINE 69:     a.expenditure,
             ^
HINT:  Perhaps you meant to reference the column "p.expenditure".
SQL state: 42703
```

**File:** `database/migrations/004_enhance_activities.sql`  
**Line:** 69

**Root Cause:**
View `activity_summary_view` referenced `a.expenditure` column which doesn't exist in the activities table.

**Original Code:**
```sql
CREATE OR REPLACE VIEW activity_summary_view AS
SELECT 
    a.id,
    a.activity_name,
    a.planned_date,
    a.status,
    a.total_beneficiaries,
    a.budget,
    a.expenditure,  -- THIS DOESN'T EXIST
    a.currency,
    p.project_name,
    i.indicator_name,
    CASE 
        WHEN a.budget > 0 THEN (a.expenditure / a.budget * 100)::NUMERIC(5,2)
        ELSE 0 
    END as burn_rate_percentage
FROM activities a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN indicators i ON a.indicator_id = i.id;
```

**Fix Applied (Final Version):**
```sql
CREATE OR REPLACE VIEW activity_summary_view AS
SELECT 
    a.id,
    a.activity_name,
    a.planned_date,
    a.status,
    a.total_beneficiaries,
    a.budget as activity_budget,
    a.currency as activity_currency,
    a.is_costed,
    p.project_name,
    p.id as project_id,
    p.budget as project_budget,
    p.expenditure as project_expenditure,
    i.indicator_name,
    i.id as indicator_id,
    -- Calculate project burn rate
    CASE 
        WHEN p.budget > 0 THEN (p.expenditure / p.budget * 100)::NUMERIC(5,2)
        ELSE 0 
    END as project_burn_rate_percentage
FROM activities a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN indicators i ON a.indicator_id = i.id;
```

**Changes:**
- ❌ Removed `a.expenditure` (doesn't exist - activities don't track actual spending)
- ✅ Added `a.budget as activity_budget` (activities have planned budgets)
- ✅ Added `a.currency as activity_currency` (new column from migration)
- ✅ Added `a.is_costed` (new column from migration)
- ✅ Added `p.budget as project_budget` (project total budget)
- ✅ Added `p.expenditure as project_expenditure` (project actual spending - CORRECT!)
- ✅ Added `project_burn_rate_percentage` (calculated from project-level data)
- ✅ Added `p.id as project_id` and `i.id as indicator_id` (useful for joins)

**Rationale (Per Implementation Plan):**
- **Activities** = Planned budgets only (what we plan to spend on this activity)
- **Projects** = Both budget AND expenditure (actual spending tracked at project level)
- **Burn Rate** = Project-level metric: (Project Expenditure / Project Budget) × 100

This aligns with **CLIENT_REQUIREMENTS_CONFIRMATION.md Section 3** and **IMPLEMENTATION_TASKS.md Task 1.4, Task 2.7**.

**Status:** ✅ Fixed in `004_enhance_activities.sql`

---

## Lessons Learned

### 1. **Check for Dependent Objects Before Dropping Columns**
Always check for views, functions, or triggers that depend on columns being dropped.

**Best Practice:**
```sql
-- Drop dependent objects first
DROP VIEW IF EXISTS dependent_view_name CASCADE;

-- Then drop the column
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name CASCADE;

-- Recreate dependent objects with updated definition
CREATE OR REPLACE VIEW dependent_view_name AS ...
```

### 2. **Be Careful with Special Characters in PostgreSQL Strings**
Characters like `%` have special meaning in PostgreSQL format strings.

**Best Practice:**
```sql
-- Bad
RAISE WARNING 'Value is 50%';

-- Good - Option 1: Remove special char
RAISE WARNING 'Value is 50 percent';

-- Good - Option 2: Use format placeholder
RAISE WARNING 'Value is % percent', value;
```

### 3. **Verify All Column References in Views**
When creating or recreating views, ensure all referenced columns actually exist.

**Best Practice:**
```sql
-- Before creating view, verify columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND column_name IN ('budget', 'expenditure', 'currency');
```

### 4. **Add IF NOT EXISTS / IF EXISTS Clauses**
Makes migrations idempotent and safer to rerun.

**Best Practice:**
```sql
DROP VIEW IF EXISTS view_name CASCADE;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name type;
CREATE TABLE IF NOT EXISTS table_name (...);
```

### 5. **Test Migrations on Dev Database First**
Always test migrations on a development/staging database before production.

**Checklist:**
- [ ] Backup database
- [ ] Run migration on dev
- [ ] Verify schema changes
- [ ] Test dependent views/functions
- [ ] Verify seed data
- [ ] Test rollback script
- [ ] Only then run on production

---

## Migration Status Tracking

| Migration | Status | Issues Found | Issues Fixed |
|-----------|--------|--------------|--------------|
| 001_create_strategic_hierarchy.sql | ⏳ Pending | 0 | 0 |
| 002_update_projects.sql | ⏳ Pending | 0 | 0 |
| 003_enhance_indicators.sql | ✅ Fixed | 1 | 1 |
| 004_enhance_activities.sql | ✅ Fixed | 2 | 2 (Verified against plan) |
| 005_overhaul_cases.sql | ⏳ Pending | 0 | 0 |
| 006_monthly_snapshots.sql | ⏳ Pending | 0 | 0 |
| 007_non_program_activities.sql | ⏳ Pending | 0 | 0 |
| 008_system_configurations.sql | ⏳ Pending | 0 | 0 |
| 009_enhanced_roles.sql | ⏳ Pending | 0 | 0 |

**Total Issues Found:** 3  
**Total Issues Fixed:** 3  
**Ready for Execution:** Yes ✅

---

## Files Modified

1. ✅ `database/migrations/003_enhance_indicators.sql`
   - Fixed RAISE WARNING syntax

2. ✅ `database/migrations/004_enhance_activities.sql`
   - Added DROP VIEW CASCADE before dropping column
   - Fixed view definition to use project-level expenditure (not activity-level)
   - Added activity_budget, activity_currency, is_costed
   - Added project_budget, project_expenditure, project_burn_rate_percentage
   - Added project_id and indicator_id for easier joins
   - **Verified against implementation plan** - activities have budgets, projects track expenditure

3. ✅ `run-migrations.ps1`
   - Fixed try-catch block syntax

4. ✅ Created new support files:
   - `POSTGRESQL_SETUP_GUIDE.md`
   - `run-migrations-simple.ps1`
   - `run-migrations.bat`
   - `MIGRATION_QUICKSTART.md`

---

## Next Steps

1. ✅ All identified issues have been fixed
2. ⏳ Execute migrations using one of the provided methods:
   - **Recommended:** pgAdmin Query Tool (see MIGRATION_QUICKSTART.md)
   - Alternative: `run-migrations.bat`
   - Alternative: `run-migrations-simple.ps1 -PgPath "C:\Program Files\PostgreSQL\15\bin"`
3. ⏳ Verify all tables created successfully
4. ⏳ Verify seed data inserted correctly
5. ⏳ Test rollback scripts on dev database
6. ⏳ Proceed with Phase 1 Week 2: API Development

---

## Recommendations for Future Migrations

### Pre-Migration Checklist
- [ ] Review all migration files for syntax
- [ ] Check for dependent objects (views, functions, triggers)
- [ ] Verify all column references exist
- [ ] Test all computed columns and generated columns
- [ ] Verify foreign key relationships
- [ ] Check for special characters in strings
- [ ] Ensure all RAISE statements have proper format
- [ ] Test on development database first

### Migration File Best Practices
```sql
-- Always use IF EXISTS / IF NOT EXISTS
DROP VIEW IF EXISTS view_name CASCADE;
ALTER TABLE table ADD COLUMN IF NOT EXISTS col type;

-- Drop dependent objects before column drops
DROP VIEW IF EXISTS dependent_view CASCADE;
ALTER TABLE table DROP COLUMN IF EXISTS col CASCADE;

-- Recreate dependent objects immediately
CREATE OR REPLACE VIEW dependent_view AS ...

-- Use meaningful comments
COMMENT ON COLUMN table.col IS 'Clear description of purpose';

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- Include rollback scripts
-- See: rollback/XXX_rollback_filename.sql
```

---

**Document maintained by:** Development Team  
**Last Updated:** January 22, 2026  
**Status:** Active - In Execution Phase
