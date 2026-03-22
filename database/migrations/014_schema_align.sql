-- ============================================================
-- Migration 014: Schema Alignment
-- Aligns monthly_snapshots, non_program_activities,
-- and non_program_categories tables with their route schemas.
-- Creates activity_funding_sources for multi-source funding.
-- SAFE: additive only (ADD COLUMN IF NOT EXISTS, no drops).
-- ============================================================

BEGIN;

-- ── A. Monthly Snapshots alignment ──────────────────────────
-- Route uses snapshot_date; DB has snapshot_month. Add alias column.
ALTER TABLE monthly_snapshots
    ADD COLUMN IF NOT EXISTS snapshot_date       DATE,
    ADD COLUMN IF NOT EXISTS total_budget        DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_expenditure   DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_indicators    INTEGER       DEFAULT 0,
    ADD COLUMN IF NOT EXISTS indicators_on_track INTEGER       DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes               TEXT,
    ADD COLUMN IF NOT EXISTS financial_burn_rate         DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS programmatic_performance_rate DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS updated_by          UUID REFERENCES users(id) ON DELETE SET NULL;

-- Back-fill snapshot_date from snapshot_month
UPDATE monthly_snapshots
SET snapshot_date = snapshot_month
WHERE snapshot_date IS NULL;

-- Back-fill budget columns from existing planned_budget / actual_expenditure
UPDATE monthly_snapshots
SET total_budget      = COALESCE(planned_budget,     0),
    total_expenditure = COALESCE(actual_expenditure, 0)
WHERE total_budget = 0 AND total_expenditure = 0;

-- Back-fill computed rate columns
UPDATE monthly_snapshots
SET financial_burn_rate = CASE WHEN COALESCE(total_budget, 0) > 0
    THEN ROUND((COALESCE(total_expenditure, 0) / total_budget * 100)::NUMERIC, 2) ELSE 0 END
WHERE financial_burn_rate IS NULL;

UPDATE monthly_snapshots
SET programmatic_performance_rate = CASE WHEN COALESCE(total_indicators, 0) > 0
    THEN ROUND((COALESCE(indicators_on_track, 0)::DECIMAL / total_indicators * 100)::NUMERIC, 2) ELSE 0 END
WHERE programmatic_performance_rate IS NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_snap_snapshot_date   ON monthly_snapshots (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_monthly_snap_project_date    ON monthly_snapshots (project_id, snapshot_date);

-- ── B. Non-program activities alignment ─────────────────────
-- Route expects: reporting_period, unit_of_measure, start_date, end_date
-- DB currently has: planned_date NOT NULL, unit, status

ALTER TABLE non_program_activities
    ADD COLUMN IF NOT EXISTS reporting_period VARCHAR(100),
    ADD COLUMN IF NOT EXISTS unit_of_measure  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS start_date       DATE,
    ADD COLUMN IF NOT EXISTS end_date         DATE,
    ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS updated_by       UUID REFERENCES users(id) ON DELETE SET NULL;

-- Make planned_date optional (route uses start_date)
ALTER TABLE non_program_activities
    ALTER COLUMN planned_date DROP NOT NULL;

-- Back-fill new columns from existing ones
UPDATE non_program_activities
SET start_date     = planned_date
WHERE start_date IS NULL AND planned_date IS NOT NULL;

UPDATE non_program_activities
SET unit_of_measure = unit
WHERE unit_of_measure IS NULL AND unit IS NOT NULL;

-- ── C. Non-program categories alignment ─────────────────────
-- Route expects: color, icon, updated_by

ALTER TABLE non_program_categories
    ADD COLUMN IF NOT EXISTS color      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS icon       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ── D. Activity Funding Sources (multi-source funding #6) ───
CREATE TABLE IF NOT EXISTS activity_funding_sources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    source_name VARCHAR(200) NOT NULL,
    source_type VARCHAR(50)  NOT NULL DEFAULT 'donor'
                  CHECK (source_type IN ('donor','grant','co-funding','own-funds','other')),
    amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency    VARCHAR(10)   NOT NULL DEFAULT 'UGX',
    percentage  NUMERIC(5,2),
    notes       TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_sources_activity ON activity_funding_sources (activity_id);
CREATE INDEX IF NOT EXISTS idx_funding_sources_type     ON activity_funding_sources (source_type);

COMMIT;
