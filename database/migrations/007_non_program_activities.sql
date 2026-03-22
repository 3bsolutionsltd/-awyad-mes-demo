-- Migration: 007 - Create Non-Program Activities
-- Description: Creates tables for tracking non-program activities
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- NON-PROGRAM CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS non_program_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Seed initial categories
INSERT INTO non_program_categories (code, name, description, display_order) VALUES
('PARTNERSHIP', 'Partnerships', 'Partnership development and management activities', 1),
('COMMUNICATIONS', 'Communications', 'Communications and outreach activities', 2),
('ADVOCACY', 'Advocacy', 'Advocacy and policy influence activities', 3),
('HR', 'Human Resources', 'HR and staff management activities', 4),
('ED_OFFICE', 'Executive Director Office', 'ED office strategic activities', 5),
('LOGISTICS', 'Logistics and Procurement', 'Logistics, procurement, and supply chain activities', 6)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- NON-PROGRAM ACTIVITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS non_program_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES non_program_categories(id) ON DELETE CASCADE,
    activity_name VARCHAR(500) NOT NULL,
    description TEXT,
    planned_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
    
    -- Simple target/achieved tracking
    target INTEGER DEFAULT 0,
    achieved INTEGER DEFAULT 0,
    unit VARCHAR(100), -- Unit of measurement (e.g., "partnerships", "events", "staff trained")
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_non_program_categories_active ON non_program_categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_non_program_categories_code ON non_program_categories(code);

CREATE INDEX IF NOT EXISTS idx_non_program_activities_category ON non_program_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_status ON non_program_activities(status);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_planned_date ON non_program_activities(planned_date);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_completion_date ON non_program_activities(completion_date);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_non_program_categories_updated_at BEFORE UPDATE ON non_program_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_program_activities_updated_at BEFORE UPDATE ON non_program_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE non_program_categories IS 'Categories for non-program activities (Partnerships, HR, etc.)';
COMMENT ON TABLE non_program_activities IS 'Activities not tied to specific projects or indicators';
COMMENT ON COLUMN non_program_activities.target IS 'What was planned to be achieved';
COMMENT ON COLUMN non_program_activities.achieved IS 'What was actually achieved';
COMMENT ON COLUMN non_program_activities.unit IS 'Unit of measurement (e.g., partnerships, events, staff)';

-- Migration complete
-- Next step: Run 008_system_configurations.sql
