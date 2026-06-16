/**
 * Import JSON mock data into PostgreSQL
 * Usage: node database/import-json-to-pg.js [path/to/mockData.js]
 *
 * Reads the mockData export and inserts thematic areas, projects,
 * indicators, activities, and cases into the live PostgreSQL database.
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'awyad_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'awyad_mes',
};

// ── resolve data file ────────────────────────────────────────────────────────

const dataFilePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'data', 'mockData.js');

console.log(`\n📂 Loading data from: ${dataFilePath}\n`);

let mockData;
try {
  const raw = readFileSync(dataFilePath, 'utf8')
    // strip ES module export so we can JSON.parse the object literal
    .replace(/^export\s+const\s+\w+\s*=\s*/, '')
    .replace(/;?\s*$/, '');
  mockData = JSON.parse(raw);
} catch (e) {
  // fallback: dynamic import if JSON.parse fails (true ES module)
  const mod = await import(pathToFileURL(dataFilePath).href);
  mockData = mod.mockData || mod.default;
}

const {
  thematicAreas = [],
  projects = [],
  indicators = [],
  activities = [],
  cases = [],
} = mockData;

console.log(`Found:`);
console.log(`  thematicAreas : ${thematicAreas.length}`);
console.log(`  projects      : ${projects.length}`);
console.log(`  indicators    : ${indicators.length}`);
console.log(`  activities    : ${activities.length}`);
console.log(`  cases         : ${cases.length}\n`);

// ── helpers ──────────────────────────────────────────────────────────────────

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

function safeNum(val, fallback = 0) {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

// ── main import ──────────────────────────────────────────────────────────────

async function run() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('✅ Connected to PostgreSQL\n');

  let counts = { thematicAreas: 0, projects: 0, indicators: 0, activities: 0, cases: 0 };

  try {
    await client.query('BEGIN');

    // ── 1. Thematic Areas ──────────────────────────────────────────────────
    console.log('📥 Importing thematic areas...');
    for (const ta of thematicAreas) {
      const res = await client.query(
        `INSERT INTO thematic_areas (code, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [ta.code || ta.id, ta.name, ta.description || null]
      );
      if (res.rowCount > 0) counts.thematicAreas++;
    }
    console.log(`   ✔ ${counts.thematicAreas} inserted (skipped duplicates)\n`);

    // ── 2. Projects ────────────────────────────────────────────────────────
    console.log('📥 Importing projects...');
    for (const p of projects) {
      // Resolve thematic_area_id by code or name
      let taId = null;
      if (p.thematicAreaId) {
        const ta = thematicAreas.find(t => t.id === p.thematicAreaId);
        if (ta) {
          const taRow = await client.query(
            'SELECT id FROM thematic_areas WHERE code = $1',
            [ta.code || ta.id]
          );
          taId = taRow.rows[0]?.id || null;
        }
      }

      const res = await client.query(
        `INSERT INTO projects
           (name, description, status, start_date, end_date, budget, expenditure, thematic_area_id, donor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          p.name,
          p.description || null,
          p.status || 'Active',
          safeDate(p.startDate),
          safeDate(p.endDate),
          safeNum(p.budget),
          safeNum(p.expenditure),
          taId,
          p.donor || 'Unknown',
        ]
      );
      if (res.rowCount > 0) counts.projects++;
    }
    console.log(`   ✔ ${counts.projects} inserted (skipped duplicates)\n`);

    // ── 3. Indicators ──────────────────────────────────────────────────────
    console.log('📥 Importing indicators...');
    for (const ind of indicators) {
      // Resolve project_id
      let projId = null;
      if (ind.projectId) {
        const proj = projects.find(p => p.id === ind.projectId);
        if (proj) {
          const projRow = await client.query(
            'SELECT id FROM projects WHERE name = $1',
            [proj.name]
          );
          projId = projRow.rows[0]?.id || null;
        }
      }

      // Resolve thematic_area_id
      let taId = null;
      if (ind.thematicAreaId) {
        const ta = thematicAreas.find(t => t.id === ind.thematicAreaId);
        if (ta) {
          const taRow = await client.query(
            'SELECT id FROM thematic_areas WHERE code = $1',
            [ta.code || ta.id]
          );
          taId = taRow.rows[0]?.id || null;
        }
      }

      // indicator_scope: use 'project' only when project_id is set AND result_area exists
      // otherwise fall back to 'awyad' to satisfy the DB trigger
      const resultArea = ind.resultArea || ind.result_area || ind.name || ind.code || 'General';
      const indicatorScope = projId ? 'project' : 'awyad';

      const res = await client.query(
        `INSERT INTO indicators
           (code, name, type, baseline, baseline_date, lop_target, annual_target,
            achieved, unit, project_id, thematic_area_id,
            q1_target, q2_target, q3_target, q4_target,
            indicator_scope, result_area)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [
          ind.code || ind.id,
          ind.name,
          ind.type || 'Output',
          safeNum(ind.baseline),
          safeDate(ind.baselineDate),
          safeNum(ind.lopTarget),
          safeNum(ind.annualTarget),
          safeNum(ind.achieved),
          ind.unit || 'Individuals',
          projId,
          taId,
          safeNum(ind.q1Target),
          safeNum(ind.q2Target),
          safeNum(ind.q3Target),
          safeNum(ind.q4Target),
          indicatorScope,
          resultArea,
        ]
      );
      if (res.rowCount > 0) counts.indicators++;
    }
    console.log(`   ✔ ${counts.indicators} inserted (skipped duplicates)\n`);

    // ── 4. Activities ──────────────────────────────────────────────────────
    console.log('📥 Importing activities...');
    for (const act of activities) {
      // Resolve indicator_id
      let indId = null;
      if (act.indicatorId) {
        const ind = indicators.find(i => i.id === act.indicatorId);
        if (ind) {
          const indRow = await client.query(
            'SELECT id FROM indicators WHERE code = $1',
            [ind.code || ind.id]
          );
          indId = indRow.rows[0]?.id || null;
        }
      }

      // Resolve project_id
      let projId = null;
      if (act.projectId) {
        const proj = projects.find(p => p.id === act.projectId);
        if (proj) {
          const projRow = await client.query(
            'SELECT id FROM projects WHERE name = $1',
            [proj.name]
          );
          projId = projRow.rows[0]?.id || null;
        }
      }

      const dis = act.disaggregation || {};
      const ref = dis.refugee || {};
      const hst = dis.host || {};
      const refM = ref.male || {};
      const refF = ref.female || {};
      const hstM = hst.male || {};
      const hstF = hst.female || {};
      const nat = act.nationality || {};

      // Resolve thematic_area_id via project
      let actTaId = null;
      if (projId) {
        const taRow = await client.query(
          'SELECT thematic_area_id FROM projects WHERE id = $1',
          [projId]
        );
        actTaId = taRow.rows[0]?.thematic_area_id || null;
      }

      const res = await client.query(
        `INSERT INTO activities
           (activity_name, status, planned_date, location,
            target_value, achieved_value, budget, actual_cost,
            indicator_id, project_id, thematic_area_id,
            refugee_male_0_4, refugee_male_5_17, refugee_male_18_49, refugee_male_50_plus,
            refugee_female_0_4, refugee_female_5_17, refugee_female_18_49, refugee_female_50_plus,
            host_male_0_4, host_male_5_17, host_male_18_49, host_male_50_plus,
            host_female_0_4, host_female_5_17, host_female_18_49, host_female_50_plus,
            nationality_sudanese, nationality_congolese, nationality_south_sudanese, nationality_others)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16,$17,$18,$19,
            $20,$21,$22,$23,$24,$25,$26,$27,
            $28,$29,$30,$31)
         RETURNING id`,
        [
          act.name,
          act.status || 'Planned',
          safeDate(act.date) || new Date().toISOString().split('T')[0],
          act.location || 'Unknown',
          safeNum(act.target),
          safeNum(act.achieved),
          safeNum(act.budget),
          safeNum(act.expenditure),
          indId,
          projId,
          actTaId,
          safeNum(refM['0-4']),  safeNum(refM['5-17']),  safeNum(refM['18-49']),  safeNum(refM['50+']),
          safeNum(refF['0-4']),  safeNum(refF['5-17']),  safeNum(refF['18-49']),  safeNum(refF['50+']),
          safeNum(hstM['0-4']),  safeNum(hstM['5-17']),  safeNum(hstM['18-49']),  safeNum(hstM['50+']),
          safeNum(hstF['0-4']),  safeNum(hstF['5-17']),  safeNum(hstF['18-49']),  safeNum(hstF['50+']),
          safeNum(nat.sudanese), safeNum(nat.congolese), safeNum(nat.southSudanese), safeNum(nat.others),
        ]
      );
      if (res.rowCount > 0) counts.activities++;
    }
    console.log(`   ✔ ${counts.activities} inserted (skipped duplicates)\n`);

    // ── 5. Cases ───────────────────────────────────────────────────────────
    if (cases.length > 0) {
      console.log('📥 Importing cases...');
      for (const c of cases) {
        const res = await client.query(
          `INSERT INTO cases
             (case_number, case_type, status, registration_date, description,
              age, gender, nationality, location, project_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (case_number) DO NOTHING
           RETURNING id`,
          [
            c.caseNumber || c.id,
            c.caseType || c.type || null,
            c.status || 'Open',
            safeDate(c.registrationDate || c.date),
            c.description || null,
            c.age || null,
            c.gender || null,
            c.nationality || null,
            c.location || null,
            null,
          ]
        );
        if (res.rowCount > 0) counts.cases++;
      }
      console.log(`   ✔ ${counts.cases} inserted (skipped duplicates)\n`);
    }

    await client.query('COMMIT');

    console.log('✅ Import complete!\n');
    console.log('Summary:');
    console.log(`  thematicAreas : ${counts.thematicAreas}`);
    console.log(`  projects      : ${counts.projects}`);
    console.log(`  indicators    : ${counts.indicators}`);
    console.log(`  activities    : ${counts.activities}`);
    console.log(`  cases         : ${counts.cases}\n`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed (rolled back):', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
