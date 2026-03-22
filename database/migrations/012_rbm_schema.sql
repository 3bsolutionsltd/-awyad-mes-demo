-- ============================================================
-- Migration 012: RBM Schema
-- Results-Based Management tables
-- SAFE: additive only. No existing tables modified except
--       one new column added to thematic_areas (IF NOT EXISTS).
-- Rollback: database/migrations/rollback/012_rbm_schema_rollback.sql
-- ============================================================

BEGIN;

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Organizational Indicators ────────────────────────────────
-- High-level indicators owned by thematic areas, linked to a result level
CREATE TABLE IF NOT EXISTS organizational_indicators (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    thematic_area_id        UUID NOT NULL REFERENCES thematic_areas(id) ON DELETE RESTRICT,
    result_level            VARCHAR(20) NOT NULL CHECK (result_level IN ('impact', 'outcome', 'output')),
    calculation_type        VARCHAR(20) NOT NULL DEFAULT 'SUM'
                              CHECK (calculation_type IN ('SUM','COUNT','AVG','RATIO','PERCENTAGE','CUMULATIVE')),
    unit_of_measure         VARCHAR(100),
    target_value            NUMERIC(15,4),
    baseline_value          NUMERIC(15,4),
    baseline_year           INTEGER,
    min_value               NUMERIC(15,4),
    max_value               NUMERIC(15,4),
    disaggregation_types    JSONB NOT NULL DEFAULT '[]',
    reporting_frequency     VARCHAR(20) NOT NULL DEFAULT 'quarterly'
                              CHECK (reporting_frequency IN ('monthly','quarterly','annual')),
    data_source             TEXT,
    collection_method       TEXT,
    responsible_team        VARCHAR(200),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Project Indicators ────────────────────────────────────────
-- Links organizational indicators to specific projects with project-level targets
CREATE TABLE IF NOT EXISTS project_indicators (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id                  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organizational_indicator_id UUID NOT NULL REFERENCES organizational_indicators(id) ON DELETE CASCADE,
    project_target_value        NUMERIC(15,4),
    project_baseline_value      NUMERIC(15,4),
    weight                      NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, organizational_indicator_id)
);

-- ── Indicator Values ──────────────────────────────────────────
-- Source of truth for all reported data. Computed values are NEVER stored here.
CREATE TABLE IF NOT EXISTS indicator_values (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizational_indicator_id UUID NOT NULL REFERENCES organizational_indicators(id) ON DELETE RESTRICT,
    project_id                  UUID REFERENCES projects(id) ON DELETE SET NULL,
    activity_id                 UUID REFERENCES activities(id) ON DELETE SET NULL,
    value                       NUMERIC(15,4) NOT NULL,
    disaggregation_type         VARCHAR(100),
    disaggregation_value        VARCHAR(200),
    reporting_period_start      DATE NOT NULL,
    reporting_period_end        DATE NOT NULL,
    data_source                 TEXT,
    collection_method           VARCHAR(200),
    notes                       TEXT,
    validation_status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                                  CHECK (validation_status IN ('pending','verified','rejected','flagged')),
    validated_by                UUID REFERENCES users(id) ON DELETE SET NULL,
    validation_metadata         JSONB NOT NULL DEFAULT '{}',
    quality_score               INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    quality_checks              JSONB NOT NULL DEFAULT '[]',
    entered_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_period CHECK (reporting_period_start <= reporting_period_end)
);

-- ── Activity Indicators ───────────────────────────────────────
-- Junction table: activities contribute to organizational indicators
CREATE TABLE IF NOT EXISTS activity_indicators (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id                 UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    organizational_indicator_id UUID NOT NULL REFERENCES organizational_indicators(id) ON DELETE CASCADE,
    contribution_weight         NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (activity_id, organizational_indicator_id)
);

-- ── Validation Audit Log ──────────────────────────────────────
-- Immutable audit trail for every status change on indicator_values
CREATE TABLE IF NOT EXISTS validation_audit_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_value_id  UUID NOT NULL REFERENCES indicator_values(id) ON DELETE CASCADE,
    action              VARCHAR(50) NOT NULL,
    performed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Strategic column on thematic_areas (additive, safe) ───────
ALTER TABLE thematic_areas
    ADD COLUMN IF NOT EXISTS core_program_component_id UUID
        REFERENCES core_program_components(id) ON DELETE SET NULL;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_org_ind_thematic      ON organizational_indicators (thematic_area_id);
CREATE INDEX IF NOT EXISTS idx_org_ind_result_level  ON organizational_indicators (result_level);
CREATE INDEX IF NOT EXISTS idx_org_ind_active        ON organizational_indicators (is_active);

CREATE INDEX IF NOT EXISTS idx_proj_ind_project      ON project_indicators (project_id);
CREATE INDEX IF NOT EXISTS idx_proj_ind_org          ON project_indicators (organizational_indicator_id);

CREATE INDEX IF NOT EXISTS idx_ind_val_org           ON indicator_values (organizational_indicator_id);
CREATE INDEX IF NOT EXISTS idx_ind_val_project       ON indicator_values (project_id);
CREATE INDEX IF NOT EXISTS idx_ind_val_activity      ON indicator_values (activity_id);
CREATE INDEX IF NOT EXISTS idx_ind_val_period        ON indicator_values (reporting_period_start, reporting_period_end);
CREATE INDEX IF NOT EXISTS idx_ind_val_status        ON indicator_values (validation_status);

CREATE INDEX IF NOT EXISTS idx_act_ind_activity      ON activity_indicators (activity_id);
CREATE INDEX IF NOT EXISTS idx_act_ind_org           ON activity_indicators (organizational_indicator_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_value_id    ON validation_audit_log (indicator_value_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created     ON validation_audit_log (created_at);

CREATE INDEX IF NOT EXISTS idx_thematic_areas_pillar ON thematic_areas (core_program_component_id);

COMMIT;
