-- Rollback Migration: 036 - Remove Reporting Month from Activities
-- Description: Removes the reporting_month field from activities table

-- Drop index
DROP INDEX IF EXISTS idx_activities_reporting_month;

-- Remove reporting_month column
ALTER TABLE activities 
DROP COLUMN IF EXISTS reporting_month;

-- Rollback completed
