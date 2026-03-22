-- Migration: 003 - Enhance Indicators Schema
-- Description: Adds two-tier indicator system, quarterly breakdown, and data types
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- UPDATE INDICATORS TABLE
-- ============================================

-- Add indicator scope to differentiate AWYAD vs Project indicators
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS indicator_scope VARCHAR(20) DEFAULT 'project' 
CHECK (indicator_scope IN ('awyad', 'project'));

-- Add result area for project indicators
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS result_area VARCHAR(200);

-- Add indicator level
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS indicator_level VARCHAR(50) 
CHECK (indicator_level IN ('output', 'outcome', 'impact'));

-- Add data type to handle numbers vs percentages
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS data_type VARCHAR(20) DEFAULT 'number' 
CHECK (data_type IN ('number', 'percentage'));

-- Add quarterly targets (Q1, Q2, Q3, Q4)
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q1_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q2_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q3_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q4_target INTEGER DEFAULT 0;

-- Add quarterly achieved values
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q1_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q2_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q3_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q4_achieved INTEGER DEFAULT 0;

-- Add LOP (Life of Project) target
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS lop_target INTEGER DEFAULT 0;

-- Add annual target (if not exists)
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS annual_target INTEGER DEFAULT 0;

-- Add achieved value (if not exists)
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS achieved INTEGER DEFAULT 0;

-- Add baseline date
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS baseline_date DATE;

-- Make thematic_area_id nullable (not all indicators need it)
ALTER TABLE indicators ALTER COLUMN thematic_area_id DROP NOT NULL;

-- Add project_id for project-specific indicators
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- ============================================
-- INDICATOR MAPPINGS TABLE
-- ============================================

-- Links project indicators to AWYAD indicators
CREATE TABLE IF NOT EXISTS indicator_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awyad_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    project_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    contribution_weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Ensure we don't map the same indicators twice
    UNIQUE(awyad_indicator_id, project_indicator_id),
    
    -- Ensure we're mapping correctly (AWYAD indicator to project indicator)
    CHECK (awyad_indicator_id != project_indicator_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_indicators_scope ON indicators(indicator_scope);
CREATE INDEX IF NOT EXISTS idx_indicators_level ON indicators(indicator_level);
CREATE INDEX IF NOT EXISTS idx_indicators_data_type ON indicators(data_type);
CREATE INDEX IF NOT EXISTS idx_indicators_project_id ON indicators(project_id);
CREATE INDEX IF NOT EXISTS idx_indicators_result_area ON indicators(result_area);

CREATE INDEX IF NOT EXISTS idx_indicator_mappings_awyad ON indicator_mappings(awyad_indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_mappings_project ON indicator_mappings(project_indicator_id);

-- ============================================
-- VALIDATION FUNCTION
-- ============================================

-- Function to validate that AWYAD indicators have thematic_area_id
-- and project indicators have project_id and result_area
CREATE OR REPLACE FUNCTION validate_indicator_scope()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.indicator_scope = 'awyad' AND NEW.thematic_area_id IS NULL THEN
        RAISE EXCEPTION 'AWYAD indicators must have a thematic_area_id';
    END IF;
    
    IF NEW.indicator_scope = 'project' AND NEW.project_id IS NULL THEN
        RAISE EXCEPTION 'Project indicators must have a project_id';
    END IF;
    
    IF NEW.indicator_scope = 'project' AND (NEW.result_area IS NULL OR NEW.result_area = '') THEN
        RAISE EXCEPTION 'Project indicators must have a result_area';
    END IF;
    
    IF NEW.data_type = 'percentage' AND NEW.achieved > 100 THEN
        RAISE WARNING 'Percentage value exceeds 100 percent: %', NEW.achieved;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER validate_indicator_scope_trigger 
    BEFORE INSERT OR UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION validate_indicator_scope();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN indicators.indicator_scope IS 'Type of indicator: awyad (strategic/overall) or project (project-specific)';
COMMENT ON COLUMN indicators.result_area IS 'Result area for project indicators';
COMMENT ON COLUMN indicators.indicator_level IS 'Level of indicator: output, outcome, or impact';
COMMENT ON COLUMN indicators.data_type IS 'How to display the indicator: number or percentage';
COMMENT ON COLUMN indicators.lop_target IS 'Life of Project target value';
COMMENT ON COLUMN indicators.annual_target IS 'Annual target value';
COMMENT ON COLUMN indicators.q1_target IS 'Quarter 1 target value';
COMMENT ON COLUMN indicators.q2_target IS 'Quarter 2 target value';
COMMENT ON COLUMN indicators.q3_target IS 'Quarter 3 target value';
COMMENT ON COLUMN indicators.q4_target IS 'Quarter 4 target value';

COMMENT ON TABLE indicator_mappings IS 'Maps project indicators to AWYAD indicators to show contribution';
COMMENT ON COLUMN indicator_mappings.contribution_weight IS 'Weight/factor of how much this project indicator contributes to the AWYAD indicator';

-- Migration complete
-- Next step: Run 004_enhance_activities.sql
