import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password123',
  database: 'awyad_mes',
});

const THEMATIC_1 = '6a12be56-7aee-46ff-a920-11b96d864184';
const THEMATIC_2 = 'b5ebabe3-6a4d-4093-8272-6d3522285eaa';
const PROJECT_1  = '989d4e50-f00f-4d0b-9059-8cbfb2a293a9';
const PROJECT_2  = '7bccbd22-3333-4644-8307-96a5b7156c32';
const USER_1     = 'daff47c0-d71b-4a69-8060-19f657cdb142';

try {
  await client.connect();
  console.log('Connected. Seeding RBM test data...');

  // 1. Organizational Indicators
  const indResult = await client.query(`
    INSERT INTO organizational_indicators
      (name, description, thematic_area_id, result_level, calculation_type,
       unit_of_measure, target_value, baseline_value, baseline_year,
       disaggregation_types, reporting_frequency, data_source, responsible_team,
       is_active, created_by)
    VALUES
      ('# Beneficiaries Reached', 'Total unique beneficiaries reached by program activities',
       $1, 'output', 'SUM', 'persons', 5000, 120, 2024,
       '["gender","age_group"]', 'quarterly', 'Activity Reports', 'M&E Team', true, $3),
      ('% Women Beneficiaries', 'Percentage of women among total beneficiaries',
       $1, 'outcome', 'PERCENTAGE', 'percent', 60, 48, 2024,
       '["age_group"]', 'quarterly', 'Kobo Surveys', 'M&E Team', true, $3),
      ('# Youth Trained', 'Number of youth receiving vocational or life-skills training',
       $2, 'output', 'COUNT', 'persons', 800, 30, 2024,
       '["gender","location"]', 'monthly', 'Training Registers', 'Programs Team', true, $3),
      ('Livelihood Income Change (%)', 'Average % change in monthly household income',
       $2, 'impact', 'AVG', 'percent', 25, 0, 2024,
       '["gender","location"]', 'annual', 'Household Survey', 'M&E Team', true, $3)
    ON CONFLICT DO NOTHING
    RETURNING id, name
  `, [THEMATIC_1, THEMATIC_2, USER_1]);

  console.log('Indicators created:', indResult.rows.map(r => r.name).join(', ') || '(already existed)');

  // Fetch all indicator IDs
  const allInds = await client.query(
    "SELECT id, name FROM organizational_indicators WHERE is_active = true ORDER BY created_at LIMIT 4"
  );
  const [IND1, IND2, IND3, IND4] = allInds.rows.map(r => r.id);

  // 2. Project Indicators (link indicators to projects)
  if (IND1 && IND2) {
    await client.query(`
      INSERT INTO project_indicators
        (project_id, organizational_indicator_id, project_target_value, project_baseline_value, weight)
      VALUES
        ($1, $3, 2000, 50, 1.00),
        ($1, $4, 300,  20, 0.75),
        ($2, $3, 1500, 40, 1.00)
      ON CONFLICT DO NOTHING
    `, [PROJECT_1, PROJECT_2, IND1, IND2]);
    console.log('Project indicators linked.');
  }

  // 3. Indicator Values with various statuses
  if (IND1 && IND2 && IND3) {
    await client.query(`
      INSERT INTO indicator_values
        (organizational_indicator_id, project_id, value, disaggregation_type, disaggregation_value,
         reporting_period_start, reporting_period_end, data_source, notes,
         validation_status, entered_by)
      VALUES
        ($1, $4, 320, 'gender', 'female', '2025-01-01', '2025-03-31', 'Activity Reports', 'Q1 data', 'pending',   $6),
        ($1, $4, 280, 'gender', 'male',   '2025-01-01', '2025-03-31', 'Activity Reports', 'Q1 data', 'pending',   $6),
        ($2, $4, 185, 'gender', 'female', '2025-04-01', '2025-06-30', 'Kobo Survey',     'Q2 data', 'verified',  $6),
        ($2, $4, 165, 'gender', 'male',   '2025-04-01', '2025-06-30', 'Kobo Survey',     'Q2 data', 'verified',  $6),
        ($3, $5, 95,  'gender', 'female', '2025-07-01', '2025-09-30', 'Training Log',    'Q3 data', 'flagged',   $6),
        ($3, $5, 110, 'gender', 'male',   '2025-07-01', '2025-09-30', 'Training Log',    'Q3 data', 'rejected',  $6),
        ($1, $4, 410, 'gender', 'female', '2025-10-01', '2025-12-31', 'Activity Reports','Q4 data', 'pending',   $6),
        ($1, $4, 390, 'gender', 'male',   '2025-10-01', '2025-12-31', 'Activity Reports','Q4 data', 'pending',   $6)
      ON CONFLICT DO NOTHING
    `, [IND1, IND2, IND3, PROJECT_1, PROJECT_2, USER_1]);
    console.log('Indicator values seeded (8 rows).');
  }

  // 4. Validation audit log entries for verified values
  const verifiedVals = await client.query(
    "SELECT id FROM indicator_values WHERE validation_status = 'verified' LIMIT 2"
  );
  for (const row of verifiedVals.rows) {
    await client.query(`
      INSERT INTO validation_audit_log (indicator_value_id, action, performed_by, metadata)
      VALUES ($1, 'verified', $2, '{"comment":"Data cross-checked with source registers","score":85}')
      ON CONFLICT DO NOTHING
    `, [row.id, USER_1]);
  }
  console.log(`Audit log entries created for ${verifiedVals.rowCount} verified values.`);

  // 5. Summary counts
  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM organizational_indicators) AS indicators,
      (SELECT COUNT(*) FROM project_indicators)        AS proj_indicators,
      (SELECT COUNT(*) FROM indicator_values)          AS values,
      (SELECT COUNT(*) FROM validation_audit_log)      AS audit_entries
  `);
  console.log('\nRBM Data Summary:', counts.rows[0]);
  console.log('\nSeeding complete!');
} catch (err) {
  console.error('Seed error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
