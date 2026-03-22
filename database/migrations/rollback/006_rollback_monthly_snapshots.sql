-- Rollback: 006 - Create Monthly Snapshots Table
-- Description: Drops monthly_snapshots table
-- Date: 2026-01-22

-- Drop trigger
DROP TRIGGER IF EXISTS update_monthly_snapshots_updated_at ON monthly_snapshots;

-- Drop indexes
DROP INDEX IF EXISTS idx_monthly_snapshots_performance;
DROP INDEX IF EXISTS idx_monthly_snapshots_month_project;
DROP INDEX IF EXISTS idx_monthly_snapshots_indicator;
DROP INDEX IF EXISTS idx_monthly_snapshots_project;
DROP INDEX IF EXISTS idx_monthly_snapshots_month;

-- Drop table
DROP TABLE IF EXISTS monthly_snapshots CASCADE;

-- Rollback complete
