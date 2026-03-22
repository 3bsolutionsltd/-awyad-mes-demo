-- Master Rollback Script
-- Description: Rolls back all migrations in reverse order
-- Usage: psql -U your_user -d your_database -f rollback_all_migrations.sql
-- WARNING: This will remove all changes made by migrations!

-- Start transaction
BEGIN;

\echo '========================================='
\echo 'AWYAD MES - Database Rollback Suite'
\echo 'Rolling back all Phase 1 migrations'
\echo '========================================='
\echo ''

\echo 'Rollback 009: Enhanced User Roles...'
\i rollback/009_rollback_enhanced_roles.sql
\echo '✓ User roles rollback complete'
\echo ''

\echo 'Rollback 008: System Configurations...'
\i rollback/008_rollback_system_configurations.sql
\echo '✓ System configurations rollback complete'
\echo ''

\echo 'Rollback 007: Non-Program Activities...'
\i rollback/007_rollback_non_program_activities.sql
\echo '✓ Non-program activities rollback complete'
\echo ''

\echo 'Rollback 006: Monthly Snapshots...'
\i rollback/006_rollback_monthly_snapshots.sql
\echo '✓ Monthly snapshots rollback complete'
\echo ''

\echo 'Rollback 005: Case Management Overhaul...'
\i rollback/005_rollback_cases.sql
\echo '✓ Case management rollback complete'
\echo ''

\echo 'Rollback 004: Activity Enhancements...'
\i rollback/004_rollback_activities.sql
\echo '✓ Activity enhancements rollback complete'
\echo ''

\echo 'Rollback 003: Indicator Enhancements...'
\i rollback/003_rollback_indicators.sql
\echo '✓ Indicator enhancements rollback complete'
\echo ''

\echo 'Rollback 002: Project Updates...'
\i rollback/002_rollback_projects.sql
\echo '✓ Project updates rollback complete'
\echo ''

\echo 'Rollback 001: Strategic Hierarchy...'
\i rollback/001_rollback_strategic_hierarchy.sql
\echo '✓ Strategic hierarchy rollback complete'
\echo ''

\echo '========================================='
\echo 'All rollbacks completed successfully!'
\echo '========================================='

-- Commit transaction
COMMIT;

\echo ''
\echo 'Database restored to pre-migration state!'
