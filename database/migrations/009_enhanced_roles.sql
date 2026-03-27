-- Migration: 009 - Enhanced User Roles
-- Description: Adds new user roles with specific permission mappings
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- ADD NEW ROLES
-- ============================================

-- Add permissions column if not present (schema.sql stores permissions separately)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions JSONB;
-- Allow display_name to be null for migrations that omit it
ALTER TABLE roles ALTER COLUMN display_name DROP NOT NULL;

-- Insert new roles (if they don't exist)
INSERT INTO roles (name, description, permissions) VALUES
(
    'Project Coordinator',
    'Coordinates and manages project implementation',
    '["view_dashboard", "manage_projects", "manage_activities", "manage_cases", "view_indicators", "manage_beneficiaries", "view_reports"]'::jsonb
),
(
    'M&E Officer',
    'Manages monitoring, evaluation and reporting',
    '["view_dashboard", "view_projects", "manage_indicators", "manage_activities", "view_cases", "manage_reports", "view_beneficiaries", "manage_monthly_tracking"]'::jsonb
),
(
    'M&E Assistant',
    'Assists with data entry and basic M&E tasks',
    '["view_dashboard", "view_projects", "view_indicators", "create_activities", "view_cases", "view_beneficiaries"]'::jsonb
),
(
    'Finance Officer',
    'Manages financial tracking and budget monitoring',
    '["view_dashboard", "view_projects", "view_activities", "manage_expenditures", "view_financial_reports", "approve_budget_transfers"]'::jsonb
),
(
    'Finance Assistant',
    'Assists with financial data entry',
    '["view_dashboard", "view_projects", "view_activities", "create_expenditures", "view_financial_reports"]'::jsonb
),
(
    'Executive',
    'Executive director with strategic oversight',
    '["view_dashboard", "view_all_data", "view_strategic_reports", "view_financial_reports", "view_performance_reports"]'::jsonb
),
(
    'Admin',
    'System administrator with full access',
    '["view_dashboard", "manage_all", "manage_users", "manage_roles", "manage_configurations", "manage_system_settings", "view_audit_logs"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- UPDATE EXISTING ROLES
-- ============================================

-- Update Program Manager role permissions (if exists)
UPDATE roles SET 
    permissions = '["view_dashboard", "manage_projects", "manage_activities", "manage_indicators", "view_cases", "manage_beneficiaries", "view_reports", "manage_monthly_tracking"]'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'Program Manager';

-- Update Data Entry role permissions (if exists)
UPDATE roles SET 
    permissions = '["view_dashboard", "view_projects", "create_activities", "view_indicators", "create_cases", "view_beneficiaries"]'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'Data Entry';

-- ============================================
-- CREATE ROLE HIERARCHY TABLE (optional)
-- ============================================

CREATE TABLE IF NOT EXISTS role_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(parent_role_id, child_role_id),
    CHECK(parent_role_id != child_role_id) -- Prevent self-reference
);

-- Seed role hierarchy (Admin > Executive > Program Manager > Coordinators)
DO $$
DECLARE
    admin_id UUID;
    executive_id UUID;
    pm_id UUID;
    pc_id UUID;
    me_officer_id UUID;
    finance_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_id FROM roles WHERE name = 'Admin' LIMIT 1;
    SELECT id INTO executive_id FROM roles WHERE name = 'Executive' LIMIT 1;
    SELECT id INTO pm_id FROM roles WHERE name = 'Program Manager' LIMIT 1;
    SELECT id INTO pc_id FROM roles WHERE name = 'Project Coordinator' LIMIT 1;
    SELECT id INTO me_officer_id FROM roles WHERE name = 'M&E Officer' LIMIT 1;
    SELECT id INTO finance_id FROM roles WHERE name = 'Finance Officer' LIMIT 1;
    
    -- Insert hierarchy if IDs exist
    IF admin_id IS NOT NULL AND executive_id IS NOT NULL THEN
        INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (admin_id, executive_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF executive_id IS NOT NULL AND pm_id IS NOT NULL THEN
        INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (executive_id, pm_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF pm_id IS NOT NULL AND pc_id IS NOT NULL THEN
        INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (pm_id, pc_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF pm_id IS NOT NULL AND me_officer_id IS NOT NULL THEN
        INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (pm_id, me_officer_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF pm_id IS NOT NULL AND finance_id IS NOT NULL THEN
        INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES (pm_id, finance_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_role_hierarchy_parent ON role_hierarchy(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_child ON role_hierarchy(child_role_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE role_hierarchy IS 'Defines hierarchical relationships between roles';
COMMENT ON COLUMN role_hierarchy.parent_role_id IS 'Higher-level role in hierarchy';
COMMENT ON COLUMN role_hierarchy.child_role_id IS 'Lower-level role in hierarchy';

-- Migration complete
-- All Phase 1 Week 1 migrations complete!
