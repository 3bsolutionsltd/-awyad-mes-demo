-- Migration 017: Performance Analysis Views
-- Creates SQL views for project-level performance tracking
-- performance_rate = achieved / target
-- Supports reach vs target analysis per project

-- ── View 1: v_project_performance ────────────────────────────────────────────
-- Per-project indicator achievement (performance_rate = achieved / target)
CREATE OR REPLACE VIEW v_project_performance AS
SELECT
    p.id                                                        AS project_id,
    p.name                                                      AS project_name,
    p.status                                                    AS project_status,
    COUNT(i.id)                                                 AS indicator_count,
    COALESCE(SUM(i.annual_target), 0)                           AS total_target,
    COALESCE(SUM(i.achieved), 0)                                AS total_achieved,
    CASE
        WHEN COALESCE(SUM(i.annual_target), 0) > 0
        THEN ROUND(
            (COALESCE(SUM(i.achieved), 0)::NUMERIC
             / SUM(i.annual_target)) * 100, 1
        )
        ELSE 0
    END                                                         AS performance_rate,
    COUNT(CASE
        WHEN i.annual_target > 0
         AND (i.achieved::NUMERIC / i.annual_target) >= 0.8
        THEN 1 END)                                             AS on_track_count,
    COUNT(CASE
        WHEN i.annual_target > 0
         AND (i.achieved::NUMERIC / i.annual_target) >= 0.5
         AND (i.achieved::NUMERIC / i.annual_target) < 0.8
        THEN 1 END)                                             AS at_risk_count,
    COUNT(CASE
        WHEN i.annual_target > 0
         AND (i.achieved::NUMERIC / i.annual_target) < 0.5
        THEN 1 END)                                             AS off_track_count
FROM projects p
LEFT JOIN indicators i
    ON i.project_id = p.id
    AND i.indicator_scope = 'project'
GROUP BY p.id, p.name, p.status;

-- ── View 2: v_reach_vs_target ─────────────────────────────────────────────────
-- Beneficiary reach vs target per project, aggregated from monthly snapshots
CREATE OR REPLACE VIEW v_reach_vs_target AS
SELECT
    p.id                                                        AS project_id,
    p.name                                                      AS project_name,
    COALESCE(SUM(ms.target_beneficiaries), 0)                   AS total_target_beneficiaries,
    COALESCE(SUM(ms.actual_beneficiaries), 0)                   AS total_actual_beneficiaries,
    COALESCE(MAX(ms.target_beneficiaries), 0)                   AS latest_month_target,
    COALESCE(MAX(ms.actual_beneficiaries), 0)                   AS latest_month_actual,
    CASE
        WHEN COALESCE(SUM(ms.target_beneficiaries), 0) > 0
        THEN ROUND(
            (COALESCE(SUM(ms.actual_beneficiaries), 0)::NUMERIC
             / SUM(ms.target_beneficiaries)) * 100, 1
        )
        ELSE 0
    END                                                         AS reach_rate
FROM projects p
LEFT JOIN monthly_snapshots ms ON ms.project_id = p.id
GROUP BY p.id, p.name;

-- ── View 3: v_monthly_performance_summary ────────────────────────────────────
-- Monthly performance snapshots enriched with project name
CREATE OR REPLACE VIEW v_monthly_performance_summary AS
SELECT
    ms.id,
    ms.project_id,
    p.name                                                      AS project_name,
    ms.snapshot_month,
    ms.planned_activities,
    ms.completed_activities,
    ms.target_beneficiaries,
    ms.actual_beneficiaries,
    ms.target_value,
    ms.achieved_value,
    ms.performance_rate,
    ms.activity_completion_rate,
    ms.beneficiary_reach_rate,
    ms.burn_rate,
    ms.created_at
FROM monthly_snapshots ms
JOIN projects p ON p.id = ms.project_id;
