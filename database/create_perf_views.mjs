/**
 * Creates the v_project_performance and v_reach_vs_target views
 * required by the Performance tab on the main dashboard.
 */
import { Client } from 'pg';

const client = new Client({
  host: 'localhost', port: 5432, user: 'postgres',
  password: 'password123', database: 'awyad_mes',
});

await client.connect();

// ── v_project_performance ─────────────────────────────────────────────────
// Per-project: total target, total verified achieved, performance rate
await client.query(`
  CREATE OR REPLACE VIEW v_project_performance AS
  SELECT
    p.id,
    p.name,
    p.status,
    COALESCE(SUM(pi.project_target_value), 0)                      AS total_target,
    COALESCE(SUM(iv.value),                0)                      AS total_achieved,
    CASE
      WHEN COALESCE(SUM(pi.project_target_value), 0) > 0
      THEN ROUND(
             COALESCE(SUM(iv.value), 0)
             / SUM(pi.project_target_value) * 100, 1)
      ELSE 0
    END                                                            AS performance_rate
  FROM projects p
  LEFT JOIN project_indicators pi
         ON pi.project_id = p.id AND pi.is_active = TRUE
  LEFT JOIN indicator_values iv
         ON iv.project_id = p.id
        AND iv.organizational_indicator_id = pi.organizational_indicator_id
        AND iv.validation_status = 'verified'
  GROUP BY p.id, p.name, p.status;
`);
console.log('v_project_performance created.');

// ── v_reach_vs_target ─────────────────────────────────────────────────────
// Re-use the same data but expressed as beneficiary reach terminology.
// (In the absence of a dedicated beneficiaries table, indicator values
//  serve as the proxy measure.)
await client.query(`
  CREATE OR REPLACE VIEW v_reach_vs_target AS
  SELECT
    p.id,
    p.name,
    p.status,
    COALESCE(SUM(pi.project_target_value), 0)  AS total_target_beneficiaries,
    COALESCE(SUM(iv.value),                0)  AS total_actual_beneficiaries,
    CASE
      WHEN COALESCE(SUM(pi.project_target_value), 0) > 0
      THEN ROUND(
             COALESCE(SUM(iv.value), 0)
             / SUM(pi.project_target_value) * 100, 1)
      ELSE 0
    END                                        AS reach_rate
  FROM projects p
  LEFT JOIN project_indicators pi
         ON pi.project_id = p.id AND pi.is_active = TRUE
  LEFT JOIN indicator_values iv
         ON iv.project_id = p.id
        AND iv.organizational_indicator_id = pi.organizational_indicator_id
        AND iv.validation_status = 'verified'
  GROUP BY p.id, p.name, p.status;
`);
console.log('v_reach_vs_target created.');

await client.end();
console.log('Done.');
