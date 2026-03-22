-- Migration: 006 - Create Monthly Snapshots Table
-- Description: Creates table for monthly performance tracking
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- MONTHLY SNAPSHOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_month DATE NOT NULL, -- First day of the month
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    
    -- Activity metrics
    planned_activities INTEGER DEFAULT 0,
    completed_activities INTEGER DEFAULT 0,
    
    -- Beneficiary metrics
    target_beneficiaries INTEGER DEFAULT 0,
    actual_beneficiaries INTEGER DEFAULT 0,
    
    -- Indicator metrics
    target_value INTEGER DEFAULT 0,
    achieved_value INTEGER DEFAULT 0,
    
    -- Financial metrics
    planned_budget DECIMAL(15, 2) DEFAULT 0,
    actual_expenditure DECIMAL(15, 2) DEFAULT 0,
    
    -- Computed performance rates
    performance_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN target_value > 0 
        THEN (achieved_value::DECIMAL / target_value * 100) 
        ELSE 0 END
    ) STORED,
    
    activity_completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN planned_activities > 0 
        THEN (completed_activities::DECIMAL / planned_activities * 100) 
        ELSE 0 END
    ) STORED,
    
    beneficiary_reach_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN target_beneficiaries > 0 
        THEN (actual_beneficiaries::DECIMAL / target_beneficiaries * 100) 
        ELSE 0 END
    ) STORED,
    
    burn_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN planned_budget > 0 
        THEN (actual_expenditure / planned_budget * 100) 
        ELSE 0 END
    ) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Ensure one snapshot per month/project/indicator combination
    UNIQUE(snapshot_month, project_id, indicator_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month ON monthly_snapshots(snapshot_month);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_project ON monthly_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_indicator ON monthly_snapshots(indicator_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month_project ON monthly_snapshots(snapshot_month, project_id);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_performance ON monthly_snapshots(performance_rate) 
WHERE performance_rate IS NOT NULL;

-- ============================================
-- TRIGGER
-- ============================================

CREATE TRIGGER update_monthly_snapshots_updated_at BEFORE UPDATE ON monthly_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE monthly_snapshots IS 'Monthly performance snapshots for tracking trends and rates';
COMMENT ON COLUMN monthly_snapshots.snapshot_month IS 'First day of the month being tracked';
COMMENT ON COLUMN monthly_snapshots.performance_rate IS 'Programmatic performance: (achieved/target) * 100';
COMMENT ON COLUMN monthly_snapshots.activity_completion_rate IS 'Activity completion: (completed/planned) * 100';
COMMENT ON COLUMN monthly_snapshots.beneficiary_reach_rate IS 'Beneficiary reach: (actual/target) * 100';
COMMENT ON COLUMN monthly_snapshots.burn_rate IS 'Financial burn: (expenditure/budget) * 100';

-- Migration complete
-- Next step: Run 007_non_program_activities.sql
