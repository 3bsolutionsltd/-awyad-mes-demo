-- ============================================================
-- Migration 013: AWYAD Feedback Patch
-- Adds: data_type + indicator_level to organizational_indicators
--       result_areas table, result_area_id to project_indicators
--       4 canonical AWYAD roles + role_permissions
-- SAFE: additive only. No existing data modified or deleted.
-- Rollback: database/migrations/rollback/013_feedback_patch_rollback.sql
-- ============================================================

BEGIN;

-- ── 1. Indicator form fields ──────────────────────────────
-- data_type: how the value should be displayed/formatted
ALTER TABLE organizational_indicators
    ADD COLUMN IF NOT EXISTS data_type VARCHAR(20) NOT NULL DEFAULT 'number'
        CHECK (data_type IN ('number','percentage','ratio')),
    ADD COLUMN IF NOT EXISTS indicator_level VARCHAR(20)
        CHECK (indicator_level IN ('output','outcome'));

-- ── 2. Result Areas (project-level classification) ────────
-- Thematic Area = org level; Result Area = project level (#3)
CREATE TABLE IF NOT EXISTS result_areas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link project_indicators to a result area
ALTER TABLE project_indicators
    ADD COLUMN IF NOT EXISTS result_area_id UUID
        REFERENCES result_areas(id) ON DELETE SET NULL;

-- ── 3. Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_result_areas_project    ON result_areas (project_id);
CREATE INDEX IF NOT EXISTS idx_org_ind_data_type       ON organizational_indicators (data_type);
CREATE INDEX IF NOT EXISTS idx_proj_ind_result_area    ON project_indicators (result_area_id);

-- ── 4. Canonical AWYAD Roles (#10) ───────────────────────
-- Insert 4 clean roles; skip if exact name already exists
INSERT INTO roles (name, display_name, description)
SELECT 'program_officer', 'Program Officer', 'Manages project activities, budgets, and operational reporting'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(TRIM(name)) = 'program_officer');

INSERT INTO roles (name, display_name, description)
SELECT 'me_coordinator', 'M&E Coordinator', 'Full indicator create/validate access; views all project data and dashboards'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(TRIM(name)) = 'me_coordinator');

INSERT INTO roles (name, display_name, description)
SELECT 'finance_manager', 'Finance Manager', 'Manages financial tracking, expenditures, and budget approvals'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(TRIM(name)) = 'finance_manager');

INSERT INTO roles (name, display_name, description)
SELECT 'awyad_admin', 'AWYAD Admin', 'Full system administration: users, roles, all modules'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(TRIM(name)) = 'awyad_admin');

-- ── 5. Role–Permission Mappings ───────────────────────────
-- Admin roles (admin + awyad_admin) → all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE LOWER(TRIM(r.name)) IN ('admin', 'awyad_admin')
ON CONFLICT DO NOTHING;

-- M&E Coordinator + equivalent existing roles → M&E-focused permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'indicators.create','indicators.read','indicators.update','indicators.delete',
    'projects.read',
    'activities.read','activities.read_all',
    'reports.view','reports.export',
    'dashboard.view','dashboard.view_all',
    'audit.read', 'audit_logs.read'
)
WHERE LOWER(TRIM(r.name)) IN ('me_coordinator', 'm&e officer', 'me_officer', 'me_assistant')
ON CONFLICT DO NOTHING;

-- Program Officer → project/activity management permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'projects.create','projects.read','projects.update','projects.manage_members',
    'activities.create','activities.read','activities.read_all','activities.update',
    'indicators.read',
    'reports.view',
    'dashboard.view',
    'cases.create','cases.read','cases.update'
)
WHERE LOWER(TRIM(r.name)) IN ('program_officer', 'project coordinator', 'project_coordinator', 'manager')
ON CONFLICT DO NOTHING;

-- Finance Manager + equivalent roles → financial + reporting permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'projects.read',
    'activities.read','activities.read_all',
    'reports.view','reports.export',
    'dashboard.view',
    'audit_logs.read','audit_logs.export'
)
WHERE LOWER(TRIM(r.name)) IN ('finance_manager', 'finance officer', 'finance_officer',
                              'finance assistant', 'finance_assistant')
ON CONFLICT DO NOTHING;

COMMIT;
