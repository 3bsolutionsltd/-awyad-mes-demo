# Database Migration Guide

## Overview
This directory contains all database migrations for the AWYAD MES system enhancement project. Migrations are numbered sequentially and should be run in order.

## Migration Files

### Phase 1: Database Foundation (Weeks 1)

1. **001_create_strategic_hierarchy.sql**
   - Creates: strategies, pillars, core_program_components tables
   - Purpose: Top-level organizational structure for new architecture

2. **002_update_projects.sql**
   - Modifies: projects table
   - Adds: core_program_component_id, result_area columns
   - Purpose: Link projects to new strategic hierarchy

3. **003_enhance_indicators.sql**
   - Modifies: indicators table
   - Creates: indicator_mappings table
   - Adds: Two-tier indicator system (AWYAD-level and Project-level)
   - Purpose: Enhanced indicator tracking with quarterly and LOP values

4. **004_enhance_activities.sql**
   - Modifies: activities table
   - Creates: activity_budget_transfers, currency_rates tables
   - Adds: Multi-currency, disability tracking, comprehensive disaggregation
   - Purpose: Enhanced activity tracking with PWD and age/gender disaggregation

5. **005_overhaul_cases.sql**
   - Modifies: cases table
   - Creates: case_types, case_categories tables
   - Removes: Name-related columns for privacy
   - Adds: Case typing, referral tracking, nationality, disability fields
   - Purpose: Privacy-first case management with enhanced categorization

6. **006_monthly_snapshots.sql**
   - Creates: monthly_snapshots table
   - Purpose: Monthly performance tracking with calculated rates

7. **007_non_program_activities.sql**
   - Creates: non_program_categories, non_program_activities tables
   - Purpose: Track activities outside project scope (HR, Partnerships, etc.)

8. **008_system_configurations.sql**
   - Creates: system_configurations table
   - Seeds: Partners, districts, service types, donors, organizations
   - Purpose: Generic configuration management for all lookup data

9. **009_enhanced_roles.sql**
   - Modifies: roles table
   - Creates: role_hierarchy table
   - Adds: 7 new roles with specific permissions
   - Purpose: Enhanced role-based access control

## Running Migrations

### Option 1: Run All Migrations (Recommended)
```bash
# Navigate to migrations directory
cd database/migrations

# Run all migrations
psql -U your_username -d awyad_mes -f run_all_migrations.sql
```

### Option 2: Run Individual Migrations
```bash
# Run migrations one by one in order
psql -U your_username -d awyad_mes -f 001_create_strategic_hierarchy.sql
psql -U your_username -d awyad_mes -f 002_update_projects.sql
# ... and so on
```

### Option 3: Using PowerShell Script (Windows)
```powershell
# Create and run via PowerShell
.\run-migrations.ps1
```

## Rolling Back Migrations

### Rollback All Migrations
```bash
cd database/migrations
psql -U your_username -d awyad_mes -f rollback_all_migrations.sql
```

### Rollback Individual Migrations
```bash
# Rollback in reverse order!
psql -U your_username -d awyad_mes -f rollback/009_rollback_enhanced_roles.sql
psql -U your_username -d awyad_mes -f rollback/008_rollback_system_configurations.sql
# ... and so on
```

## Pre-Migration Checklist

- [ ] **Backup database**: Create full backup before running migrations
- [ ] **Review scripts**: Read through migration files to understand changes
- [ ] **Check dependencies**: Ensure PostgreSQL 12+ is installed
- [ ] **Verify credentials**: Confirm database connection details
- [ ] **Test environment**: Run on dev/staging before production

## Post-Migration Verification

After running migrations, verify:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check column counts
SELECT 
    table_name, 
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('strategies', 'pillars', 'core_program_components', 
                       'projects', 'indicators', 'activities', 'cases')
GROUP BY table_name;

-- Check seeded data
SELECT COUNT(*) FROM case_types; -- Should be 5
SELECT COUNT(*) FROM non_program_categories; -- Should be 6
SELECT COUNT(*) FROM system_configurations; -- Should be ~30+
SELECT COUNT(*) FROM currency_rates; -- Should be 7
```

## Database Backup Commands

### Create Backup
```bash
# Full database backup
pg_dump -U your_username -d awyad_mes -F c -b -v -f "awyad_mes_backup_$(date +%Y%m%d_%H%M%S).backup"

# Schema-only backup
pg_dump -U your_username -d awyad_mes --schema-only -f awyad_mes_schema.sql
```

### Restore from Backup
```bash
# Restore full backup
pg_restore -U your_username -d awyad_mes -v awyad_mes_backup_20260122_143000.backup

# Restore from SQL file
psql -U your_username -d awyad_mes -f awyad_mes_backup.sql
```

## Troubleshooting

### Error: "relation already exists"
- **Cause**: Migration was partially run before
- **Solution**: Either rollback and rerun, or comment out conflicting statements

### Error: "permission denied"
- **Cause**: Database user lacks necessary privileges
- **Solution**: Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE awyad_mes TO your_username;`

### Error: "function update_updated_at_column() does not exist"
- **Cause**: Trigger function not created
- **Solution**: Run the function creation from run_all_migrations.sql first

### Error: "foreign key violation"
- **Cause**: Migrations run out of order
- **Solution**: Rollback all and run in correct sequence

## Migration Status Tracking

Keep a log of migration execution:

| Migration | Date Run | Status | Run By | Notes |
|-----------|----------|--------|--------|-------|
| 001 | 2026-01-22 | ✅ Completed | Admin | No issues |
| 002 | 2026-01-22 | ✅ Completed | Admin | No issues |
| ... | ... | ... | ... | ... |

## Next Steps After Migrations

1. ✅ Run all 9 migrations
2. ⏳ Create API routes for new tables (Task 2.1-2.9)
3. ⏳ Build frontend components (Task 3.1-3.8)
4. ⏳ Update existing features (Task 4.1-4.7)
5. ⏳ Testing and deployment (Phase 4)

## Contact

For migration issues or questions:
- Technical Lead: [Your Name]
- Email: [Your Email]
- Documentation: See IMPLEMENTATION_TASKS.md

---
**Last Updated**: 2026-01-22
**Phase**: 1 - Database Foundation
**Status**: Ready for execution
