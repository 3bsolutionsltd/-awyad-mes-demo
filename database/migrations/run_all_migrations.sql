-- Master Migration Runner
-- Description: Executes all migrations in sequence
-- Usage: psql -U your_user -d your_database -f run_all_migrations.sql

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Start transaction
BEGIN;

\echo '========================================='
\echo 'AWYAD MES - Database Migration Suite'
\echo 'Phase 1: Database Foundation'
\echo '========================================='
\echo ''

\echo 'Migration 001: Creating Strategic Hierarchy...'
\i 001_create_strategic_hierarchy.sql
\echo '✓ Strategic hierarchy created'
\echo ''

\echo 'Migration 002: Updating Projects...'
\i 002_update_projects.sql
\echo '✓ Projects updated'
\echo ''

\echo 'Migration 003: Enhancing Indicators...'
\i 003_enhance_indicators.sql
\echo '✓ Indicators enhanced'
\echo ''

\echo 'Migration 004: Enhancing Activities...'
\i 004_enhance_activities.sql
\echo '✓ Activities enhanced'
\echo ''

\echo 'Migration 005: Overhauling Case Management...'
\i 005_overhaul_cases.sql
\echo '✓ Case management overhauled'
\echo ''

\echo 'Migration 006: Creating Monthly Snapshots...'
\i 006_monthly_snapshots.sql
\echo '✓ Monthly snapshots created'
\echo ''

\echo 'Migration 007: Creating Non-Program Activities...'
\i 007_non_program_activities.sql
\echo '✓ Non-program activities created'
\echo ''

\echo 'Migration 008: Creating System Configurations...'
\i 008_system_configurations.sql
\echo '✓ System configurations created'
\echo ''

\echo 'Migration 009: Enhancing User Roles...'
\i 009_enhanced_roles.sql
\echo '✓ User roles enhanced'
\echo ''

\echo '========================================='
\echo 'All migrations completed successfully!'
\echo '========================================='

-- Commit transaction
COMMIT;

-- Verify tables
\echo ''
\echo 'Verifying new tables:'
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'strategies', 'pillars', 'core_program_components',
        'indicator_mappings', 'activity_budget_transfers', 'currency_rates',
        'case_types', 'case_categories', 'monthly_snapshots',
        'non_program_categories', 'non_program_activities',
        'system_configurations', 'role_hierarchy'
    )
ORDER BY table_name;

\echo ''
\echo 'Migration suite complete!'
