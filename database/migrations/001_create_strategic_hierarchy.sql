-- Migration: 001 - Create Strategic Hierarchy Tables
-- Description: Creates strategies, pillars, and core_program_components tables
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- STRATEGIES TABLE (Top Level)
-- ============================================

CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Index for active strategies ordered by display_order
CREATE INDEX idx_strategies_active_order ON strategies(is_active, display_order);
CREATE INDEX idx_strategies_code ON strategies(code);

-- ============================================
-- PILLARS TABLE (Second Level)
-- ============================================

CREATE TABLE IF NOT EXISTS pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for pillars
CREATE INDEX idx_pillars_strategy_id ON pillars(strategy_id);
CREATE INDEX idx_pillars_active_order ON pillars(is_active, display_order);
CREATE INDEX idx_pillars_code ON pillars(code);

-- ============================================
-- CORE PROGRAM COMPONENTS TABLE (Third Level)
-- ============================================

CREATE TABLE IF NOT EXISTS core_program_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Core Program Interventions stored as JSONB array
    -- Format: [{"name": "...", "description": "...", "order": 1}, ...]
    interventions JSONB DEFAULT '[]'::jsonb,
    
    -- Implementation Approaches stored as JSONB array
    -- Format: [{"name": "...", "description": "...", "order": 1}, ...]
    implementation_approaches JSONB DEFAULT '[]'::jsonb,
    
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for core program components
CREATE INDEX idx_components_pillar_id ON core_program_components(pillar_id);
CREATE INDEX idx_components_active_order ON core_program_components(is_active, display_order);
CREATE INDEX idx_components_code ON core_program_components(code);

-- GIN indexes for JSONB fields to enable fast searching
CREATE INDEX idx_components_interventions ON core_program_components USING gin(interventions);
CREATE INDEX idx_components_approaches ON core_program_components USING gin(implementation_approaches);

-- ============================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for strategies
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for pillars
CREATE TRIGGER update_pillars_updated_at BEFORE UPDATE ON pillars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for core_program_components
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON core_program_components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE strategies IS 'Top-level strategic framework for AWYAD';
COMMENT ON TABLE pillars IS 'Strategic pillars linked to strategies';
COMMENT ON TABLE core_program_components IS 'Core program components with interventions and approaches stored as JSONB';
COMMENT ON COLUMN core_program_components.interventions IS 'Array of core program interventions in JSONB format';
COMMENT ON COLUMN core_program_components.implementation_approaches IS 'Array of implementation approaches in JSONB format';

-- Migration complete
-- Next step: Run 002_update_projects.sql
