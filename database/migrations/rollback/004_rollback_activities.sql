-- Rollback: 004 - Enhance Activities Schema
-- Description: Removes activity enhancements and related tables
-- Date: 2026-01-22

-- Drop triggers
DROP TRIGGER IF EXISTS update_currency_rates_updated_at ON currency_rates;
DROP TRIGGER IF EXISTS update_budget_transfers_updated_at ON activity_budget_transfers;

-- Drop indexes
DROP INDEX IF EXISTS idx_currency_rates_active;
DROP INDEX IF EXISTS idx_currency_rates_date;
DROP INDEX IF EXISTS idx_currency_rates_to;
DROP INDEX IF EXISTS idx_currency_rates_from;
DROP INDEX IF EXISTS idx_budget_transfers_date;
DROP INDEX IF EXISTS idx_budget_transfers_status;
DROP INDEX IF EXISTS idx_budget_transfers_source_project;
DROP INDEX IF EXISTS idx_budget_transfers_activity;
DROP INDEX IF EXISTS idx_activities_is_costed;
DROP INDEX IF EXISTS idx_activities_currency;

-- Drop tables
DROP TABLE IF EXISTS currency_rates CASCADE;
DROP TABLE IF EXISTS activity_budget_transfers CASCADE;

-- Remove columns from activities
ALTER TABLE activities DROP COLUMN IF EXISTS total_beneficiaries;
ALTER TABLE activities DROP COLUMN IF EXISTS host_community;
ALTER TABLE activities DROP COLUMN IF EXISTS refugee_other;
ALTER TABLE activities DROP COLUMN IF EXISTS refugee_south_sudanese;
ALTER TABLE activities DROP COLUMN IF EXISTS refugee_congolese;
ALTER TABLE activities DROP COLUMN IF EXISTS refugee_sudanese;
ALTER TABLE activities DROP COLUMN IF EXISTS age_50_plus_other;
ALTER TABLE activities DROP COLUMN IF EXISTS age_50_plus_female;
ALTER TABLE activities DROP COLUMN IF EXISTS age_50_plus_male;
ALTER TABLE activities DROP COLUMN IF EXISTS age_18_49_other;
ALTER TABLE activities DROP COLUMN IF EXISTS age_18_49_female;
ALTER TABLE activities DROP COLUMN IF EXISTS age_18_49_male;
ALTER TABLE activities DROP COLUMN IF EXISTS age_5_17_other;
ALTER TABLE activities DROP COLUMN IF EXISTS age_5_17_female;
ALTER TABLE activities DROP COLUMN IF EXISTS age_5_17_male;
ALTER TABLE activities DROP COLUMN IF EXISTS age_0_4_other;
ALTER TABLE activities DROP COLUMN IF EXISTS age_0_4_female;
ALTER TABLE activities DROP COLUMN IF EXISTS age_0_4_male;
ALTER TABLE activities DROP COLUMN IF EXISTS pwds_other;
ALTER TABLE activities DROP COLUMN IF EXISTS pwds_female;
ALTER TABLE activities DROP COLUMN IF EXISTS pwds_male;
ALTER TABLE activities DROP COLUMN IF EXISTS currency;
ALTER TABLE activities DROP COLUMN IF EXISTS is_costed;

-- Rollback complete
