-- Rollback: 005 - Overhaul Case Management
-- Description: Removes case types/categories and case enhancements
-- Date: 2026-01-22

-- Drop triggers
DROP TRIGGER IF EXISTS update_case_categories_updated_at ON case_categories;
DROP TRIGGER IF EXISTS update_case_types_updated_at ON case_types;

-- Drop indexes
DROP INDEX IF EXISTS idx_cases_tracking_tags;
DROP INDEX IF EXISTS idx_cases_case_worker;
DROP INDEX IF EXISTS idx_cases_nationality;
DROP INDEX IF EXISTS idx_cases_has_disability;
DROP INDEX IF EXISTS idx_cases_referred_to;
DROP INDEX IF EXISTS idx_cases_referred_from;
DROP INDEX IF EXISTS idx_cases_category;
DROP INDEX IF EXISTS idx_cases_type;
DROP INDEX IF EXISTS idx_case_categories_code;
DROP INDEX IF EXISTS idx_case_categories_active;
DROP INDEX IF EXISTS idx_case_categories_type;
DROP INDEX IF EXISTS idx_case_types_code;
DROP INDEX IF EXISTS idx_case_types_active;

-- Remove columns from cases
ALTER TABLE cases DROP COLUMN IF EXISTS tracking_tags;
ALTER TABLE cases DROP COLUMN IF EXISTS has_disability;
ALTER TABLE cases DROP COLUMN IF EXISTS disability_status;
ALTER TABLE cases DROP COLUMN IF EXISTS nationality;
ALTER TABLE cases DROP COLUMN IF EXISTS referral_date;
ALTER TABLE cases DROP COLUMN IF EXISTS referred_to;
ALTER TABLE cases DROP COLUMN IF EXISTS referred_from;
ALTER TABLE cases DROP COLUMN IF EXISTS case_category_id;
ALTER TABLE cases DROP COLUMN IF EXISTS case_type_id;
ALTER TABLE cases DROP COLUMN IF EXISTS case_worker;
ALTER TABLE cases DROP COLUMN IF EXISTS case_type_old;

-- Restore support_offered to service_provided if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'support_offered') THEN
        ALTER TABLE cases RENAME COLUMN support_offered TO service_provided;
    END IF;
END $$;

-- Drop tables
DROP TABLE IF EXISTS case_categories CASCADE;
DROP TABLE IF EXISTS case_types CASCADE;

-- Rollback complete
