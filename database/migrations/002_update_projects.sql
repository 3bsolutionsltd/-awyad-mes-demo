-- Migration: 002 - Update Projects Table
-- Description: Adds core_program_component_id and result_area to projects table
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- UPDATE PROJECTS TABLE
-- ============================================

-- Add column to link projects to core program components
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS core_program_component_id UUID REFERENCES core_program_components(id) ON DELETE SET NULL;

-- Add result area field for project-specific result areas
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS result_area VARCHAR(200);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_component_id ON projects(core_program_component_id);
CREATE INDEX IF NOT EXISTS idx_projects_result_area ON projects(result_area);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN projects.core_program_component_id IS 'Links project to a core program component';
COMMENT ON COLUMN projects.result_area IS 'Project-specific result area (different from thematic areas)';

-- Migration complete
-- Next step: Run 003_enhance_indicators.sql
