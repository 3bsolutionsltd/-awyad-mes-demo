-- ============================================================
-- AWYAD MES — Demo Seed 2026
-- File: 011_demo_2026.sql
-- Purpose: Realistic 2026 demo with projects, org-level and
--          project-level indicators, activities, cases.
-- Run AFTER: 001–010 seeds have been applied.
-- Idempotent: safe to re-run.
-- ============================================================

BEGIN;

DO $$
DECLARE
    admin_id UUID := '39d21083-caed-4a8f-9476-6db6fdc8784c';

    -- Thematic area IDs
    ta_gbv          UUID;
    ta_cp           UUID;
    ta_livelihood   UUID;

    -- Component IDs (from 010_awyad_strategies.sql)
    comp_lives_gbv  UUID;  -- PROT-P2 GBV
    comp_lives_cp   UUID;  -- PROT-P2 Child Protection
    comp_resources  UUID;  -- EMP-P2 Resources
    comp_opps       UUID;  -- EMP-P3 Opportunities

    -- Project IDs
    proj_gbv        UUID;
    proj_cp         UUID;
    proj_emp        UUID;

    -- AWYAD-level (org) indicator IDs
    ind_org_gbv     UUID;
    ind_org_cp      UUID;
    ind_org_livhd   UUID;

    -- Project-level indicator IDs
    ind_pi_gbv1     UUID;
    ind_pi_gbv2     UUID;
    ind_pi_cp1      UUID;
    ind_pi_cp2      UUID;
    ind_pi_emp1     UUID;
    ind_pi_emp2     UUID;

BEGIN

    -- ================================================================
    -- THEMATIC AREAS
    -- ================================================================
    SELECT id INTO ta_gbv FROM thematic_areas WHERE code = 'RESULT 2';
    SELECT id INTO ta_cp  FROM thematic_areas WHERE code = 'RESULT 3';

    INSERT INTO thematic_areas (code, name, description, created_by, updated_by)
    VALUES ('RESULT 5',
            'Livelihoods and Economic Empowerment',
            'Local partners support economic empowerment and self-reliance for refugees and host communities.',
            admin_id, admin_id)
    ON CONFLICT (code) DO NOTHING;
    SELECT id INTO ta_livelihood FROM thematic_areas WHERE code = 'RESULT 5';

    -- Fallbacks if GBV/CP thematic areas don't exist
    IF ta_gbv IS NULL THEN
        INSERT INTO thematic_areas (code, name, description, created_by, updated_by)
        VALUES ('RESULT 2',
                'Local partners effectively respond to GBV and protection risks',
                'Survivor-centered GBV prevention and response services for refugees and host communities.',
                admin_id, admin_id)
        ON CONFLICT (code) DO NOTHING;
        SELECT id INTO ta_gbv FROM thematic_areas WHERE code = 'RESULT 2';
    END IF;

    IF ta_cp IS NULL THEN
        INSERT INTO thematic_areas (code, name, description, created_by, updated_by)
        VALUES ('RESULT 3',
                'Local partners effectively respond to Child Protection risks',
                'Case management, community-based CP, and reintegration services for children in refugee contexts.',
                admin_id, admin_id)
        ON CONFLICT (code) DO NOTHING;
        SELECT id INTO ta_cp FROM thematic_areas WHERE code = 'RESULT 3';
    END IF;

    -- ================================================================
    -- COMPONENT IDs  (created by seed 010_awyad_strategies.sql)
    -- ================================================================
    SELECT id INTO comp_lives_gbv FROM core_program_components
        WHERE code LIKE 'PROT-P2%' ORDER BY code LIMIT 1;

    SELECT id INTO comp_lives_cp FROM core_program_components
        WHERE code LIKE 'PROT-P2%' ORDER BY display_order DESC LIMIT 1;

    SELECT id INTO comp_resources FROM core_program_components
        WHERE code LIKE 'EMP-P2%' ORDER BY code LIMIT 1;

    SELECT id INTO comp_opps FROM core_program_components
        WHERE code LIKE 'EMP-P3%' ORDER BY code LIMIT 1;

    -- ================================================================
    -- PROJECTS
    -- ================================================================

    -- Project 1: GBV Prevention & Response - Nakivale
    IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'GBV Prevention & Response - Nakivale 2026') THEN
        INSERT INTO projects (name, donor, thematic_area_id, core_program_component_id, result_area,
                              status, start_date, end_date, budget, expenditure, locations, description,
                              created_by, updated_by)
        VALUES ('GBV Prevention & Response - Nakivale 2026', 'UNHCR',
                ta_gbv, comp_lives_gbv, 'Protection Services',
                'Active', '2025-07-01', '2027-06-30',
                220000.00, 97500.00,
                ARRAY['Nakivale Settlement, Isingiro District'],
                'Integrated GBV prevention and survivor-centered response for refugee women and girls in Nakivale Settlement. Includes PSS, legal aid, and community awareness.',
                admin_id, admin_id);
    END IF;
    SELECT id INTO proj_gbv FROM projects WHERE name = 'GBV Prevention & Response - Nakivale 2026';

    -- Project 2: Child Protection - Bidibidi
    IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Child Protection Services - Bidibidi 2026') THEN
        INSERT INTO projects (name, donor, thematic_area_id, core_program_component_id, result_area,
                              status, start_date, end_date, budget, expenditure, locations, description,
                              created_by, updated_by)
        VALUES ('Child Protection Services - Bidibidi 2026', 'Save the Children / EU',
                ta_cp, comp_lives_cp, 'Child Protection Services',
                'Active', '2025-04-01', '2027-03-31',
                185000.00, 62000.00,
                ARRAY['Bidibidi Settlement, Yumbe District'],
                'Comprehensive child protection services including case management, community volunteer networks, and psychosocial support for refugee children.',
                admin_id, admin_id);
    END IF;
    SELECT id INTO proj_cp FROM projects WHERE name = 'Child Protection Services - Bidibidi 2026';

    -- Project 3: Women's Economic Empowerment - Kyangwali
    IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Women''s Economic Empowerment - Kyangwali 2026') THEN
        INSERT INTO projects (name, donor, thematic_area_id, core_program_component_id, result_area,
                              status, start_date, end_date, budget, expenditure, locations, description,
                              created_by, updated_by)
        VALUES ('Women''s Economic Empowerment - Kyangwali 2026', 'WFP / GIZ',
                ta_livelihood, comp_resources, 'Livelihood Support',
                'Active', '2025-01-01', '2027-12-31',
                310000.00, 145000.00,
                ARRAY['Kyangwali Refugee Settlement, Kikuube District'],
                'Economic strengthening for refugee and host community women through VSLA, business skills, and market linkages.',
                admin_id, admin_id);
    END IF;
    SELECT id INTO proj_emp FROM projects WHERE name = 'Women''s Economic Empowerment - Kyangwali 2026';

    -- ================================================================
    -- AWYAD-LEVEL (ORG) INDICATORS
    -- ================================================================

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             thematic_area_id, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'ORG-GBV-01',
           'Number of GBV survivors reached with survivor-centered services',
           'AWYAD-level strategic indicator tracking total GBV survivors across all projects',
           'Output', 'awyad', 'output',
           ta_gbv, 'number',
           2400, 800, 0, 200, 200, 200, 200,
           215, 188, 0, 403,
           'survivors', admin_id, admin_id
    WHERE NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'ORG-GBV-01');

    SELECT id INTO ind_org_gbv FROM indicators WHERE code = 'ORG-GBV-01';

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             thematic_area_id, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'ORG-CP-01',
           'Number of children protected from violence through case management',
           'AWYAD-level indicator: children receiving structured case management services across all CP projects',
           'Output', 'awyad', 'output',
           ta_cp, 'number',
           1800, 600, 0, 150, 150, 150, 150,
           162, 140, 0, 302,
           'children', admin_id, admin_id
    WHERE NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'ORG-CP-01');

    SELECT id INTO ind_org_cp FROM indicators WHERE code = 'ORG-CP-01';

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             thematic_area_id, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'ORG-EMP-01',
           '% of women beneficiaries reporting improved income sources',
           'AWYAD strategic outcome: proportion of women with measurable income improvement after 12 months',
           'Outcome', 'awyad', 'outcome',
           ta_livelihood, 'percentage',
           75, 60, 25, 40, 50, 55, 60,
           42, 53, 0, 53,
           '%', admin_id, admin_id
    WHERE NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'ORG-EMP-01');

    SELECT id INTO ind_org_livhd FROM indicators WHERE code = 'ORG-EMP-01';

    -- ================================================================
    -- PROJECT-LEVEL INDICATORS — GBV Project
    -- ================================================================

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             project_id, result_area, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'PI-GBV-01',
           'Number of community GBV awareness and prevention sessions conducted',
           'Count of structured community awareness sessions on GBV prevention and referral pathways',
           'Output', 'project', 'output',
           proj_gbv, 'Protection Services', 'number',
           120, 40, 0, 10, 10, 10, 10,
           11, 10, 0, 21,
           'sessions', admin_id, admin_id
    WHERE proj_gbv IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'PI-GBV-01');

    SELECT id INTO ind_pi_gbv1 FROM indicators WHERE code = 'PI-GBV-01';

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             project_id, result_area, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'PI-GBV-02',
           'Number of GBV survivors enrolled in psychosocial support (PSS) program',
           'Survivors receiving structured PSS counseling and group support activities',
           'Output', 'project', 'output',
           proj_gbv, 'Protection Services', 'number',
           900, 300, 0, 75, 75, 75, 75,
           82, 79, 0, 161,
           'survivors', admin_id, admin_id
    WHERE proj_gbv IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'PI-GBV-02');

    SELECT id INTO ind_pi_gbv2 FROM indicators WHERE code = 'PI-GBV-02';

    -- ================================================================
    -- PROJECT-LEVEL INDICATORS — Child Protection Project
    -- ================================================================

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             project_id, result_area, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'PI-CP-01',
           'Number of child protection cases opened and managed',
           'Children receiving individual case management through structured child protection protocols',
           'Output', 'project', 'output',
           proj_cp, 'Child Protection Services', 'number',
           900, 300, 0, 75, 75, 75, 75,
           80, 72, 0, 152,
           'cases', admin_id, admin_id
    WHERE proj_cp IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'PI-CP-01');

    SELECT id INTO ind_pi_cp1 FROM indicators WHERE code = 'PI-CP-01';

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             project_id, result_area, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'PI-CP-02',
           'Number of community child protection volunteers (CPVs) trained and active',
           'Volunteers trained in CP monitoring, referral, and community sensitization',
           'Output', 'project', 'output',
           proj_cp, 'Child Protection Services', 'number',
           150, 50, 0, 12, 13, 12, 13,
           13, 12, 0, 25,
           'volunteers', admin_id, admin_id
    WHERE proj_cp IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'PI-CP-02');

    SELECT id INTO ind_pi_cp2 FROM indicators WHERE code = 'PI-CP-02';

    -- ================================================================
    -- PROJECT-LEVEL INDICATORS — Economic Empowerment Project
    -- ================================================================

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             project_id, result_area, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'PI-EMP-01',
           'Number of Village Savings and Loan Association (VSLA) groups formed and active',
           'Active VSLA groups with regular saving cycles and functional governance',
           'Output', 'project', 'output',
           proj_emp, 'Livelihood Support', 'number',
           90, 30, 0, 8, 7, 8, 7,
           9, 8, 0, 17,
           'groups', admin_id, admin_id
    WHERE proj_emp IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'PI-EMP-01');

    SELECT id INTO ind_pi_emp1 FROM indicators WHERE code = 'PI-EMP-01';

    INSERT INTO indicators (code, name, description, type, indicator_scope, indicator_level,
                             project_id, result_area, data_type,
                             lop_target, annual_target, baseline, q1_target, q2_target, q3_target, q4_target,
                             q1_achieved, q2_achieved, q3_achieved, achieved,
                             unit, created_by, updated_by)
    SELECT 'PI-EMP-02',
           'Number of women receiving business development skills training',
           'Women completing accredited or structured business skills modules',
           'Output', 'project', 'output',
           proj_emp, 'Livelihood Support', 'number',
           600, 200, 0, 50, 50, 50, 50,
           55, 52, 0, 107,
           'women', admin_id, admin_id
    WHERE proj_emp IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM indicators WHERE code = 'PI-EMP-02');

    SELECT id INTO ind_pi_emp2 FROM indicators WHERE code = 'PI-EMP-02';

    -- ================================================================
    -- INDICATOR MAPPINGS (project → AWYAD level)
    -- ================================================================
    -- GBV project survivors (PI-GBV-02) contributes to ORG-GBV-01
    IF ind_org_gbv IS NOT NULL AND ind_pi_gbv2 IS NOT NULL THEN
        INSERT INTO indicator_mappings (awyad_indicator_id, project_indicator_id, contribution_weight, created_by)
        VALUES (ind_org_gbv, ind_pi_gbv2, 1.0, admin_id)
        ON CONFLICT (awyad_indicator_id, project_indicator_id) DO NOTHING;
    END IF;

    -- CP cases (PI-CP-01) contributes to ORG-CP-01
    IF ind_org_cp IS NOT NULL AND ind_pi_cp1 IS NOT NULL THEN
        INSERT INTO indicator_mappings (awyad_indicator_id, project_indicator_id, contribution_weight, created_by)
        VALUES (ind_org_cp, ind_pi_cp1, 1.0, admin_id)
        ON CONFLICT (awyad_indicator_id, project_indicator_id) DO NOTHING;
    END IF;

    -- ================================================================
    -- ACTIVITIES — GBV Project (Q1/Q2 2026)
    -- ================================================================
    IF proj_gbv IS NOT NULL THEN
        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, completion_date, status, location,
                                age_18_49_female, age_18_49_male, age_5_17_female, age_5_17_male,
                                age_50_plus_female, age_50_plus_male,
                                refugee_sudanese, refugee_congolese, host_community,
                                budget, actual_cost, notes, created_by, updated_by)
        SELECT proj_gbv, ind_pi_gbv1, ta_gbv,
               'GBV Awareness and Prevention Training — Nakivale Base Camp Q1',
               'Community session covering GBV recognition, survivor rights, referral pathways, and bystander intervention. Targeted community leaders and women groups.',
               '2026-01-20', '2026-01-20', 'Completed', 'Nakivale Settlement, Base Camp',
               65, 28, 12, 8, 8, 4,
               88, 25, 12,
               3200.00, 3050.00,
               '88 participants; very high female turnout. 4 referrals made to PSS on the same day.',
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'GBV Awareness and Prevention Training — Nakivale Base Camp Q1'
        );

        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, completion_date, status, location,
                                age_18_49_female, age_18_49_male, age_5_17_female, age_5_17_male,
                                refugee_sudanese, refugee_south_sudanese, host_community,
                                budget, actual_cost, notes, created_by, updated_by)
        SELECT proj_gbv, ind_pi_gbv2, ta_gbv,
               'Individual PSS Counseling Sessions — January 2026',
               'One-on-one and group psychosocial support sessions for GBV survivors; includes safety planning and coping skills.',
               '2026-01-01', '2026-01-31', 'Completed', 'Nakivale Settlement, AWYAD Safe House',
               35, 0, 5, 0,
               22, 10, 8,
               2800.00, 2750.00,
               '40 survivors enrolled this month; 3 referred to legal aid.',
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'Individual PSS Counseling Sessions — January 2026'
        );

        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, status, location,
                                age_18_49_female, age_18_49_male, age_5_17_female,
                                refugee_sudanese, refugee_congolese,
                                budget, created_by, updated_by)
        SELECT proj_gbv, ind_pi_gbv1, ta_gbv,
               'GBV Community Sensitization — Zone 3 February 2026',
               'Follow-up sensitization targeting male community leaders in Zone 3 to promote GBV prevention and encourage help-seeking.',
               '2026-02-12', 'Planned', 'Nakivale Settlement, Zone 3 Community Hall',
               40, 35, 5,
               50, 20,
               3100.00,
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'GBV Community Sensitization — Zone 3 February 2026'
        );
    END IF;

    -- ================================================================
    -- ACTIVITIES — Child Protection Project
    -- ================================================================
    IF proj_cp IS NOT NULL THEN
        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, completion_date, status, location,
                                age_5_17_female, age_5_17_male, age_0_4_female, age_0_4_male,
                                age_18_49_female, age_18_49_male,
                                refugee_south_sudanese, refugee_congolese, host_community,
                                budget, actual_cost, notes, created_by, updated_by)
        SELECT proj_cp, ind_pi_cp2, ta_cp,
               'Child Protection Volunteer (CPV) Training — Bidibidi Zone 1',
               '3-day residential training for 13 community child protection volunteers. Topics: CP principles, case identification, referral, best interest of child.',
               '2026-01-13', '2026-01-15', 'Completed', 'Bidibidi Settlement, Zone 1 Training Center',
               8, 5, 0, 0,
               5, 3,
               120, 45, 18,
               4500.00, 4320.00,
               'All 13 CPVs certified. Immediate deployment to monitoring rounds.',
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'Child Protection Volunteer (CPV) Training — Bidibidi Zone 1'
        );

        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, completion_date, status, location,
                                age_5_17_female, age_5_17_male,
                                age_18_49_female, age_18_49_male,
                                refugee_south_sudanese, refugee_congolese,
                                budget, actual_cost, notes, created_by, updated_by)
        SELECT proj_cp, ind_pi_cp1, ta_cp,
               'CP Case Management Review — Q1 2026',
               'Monthly case management review meeting for active CP cases. Covers case progress, safety plans, and closure criteria.',
               '2026-01-28', '2026-01-28', 'Completed', 'Bidibidi AWYAD Office',
               0, 0, 4, 3,
               60, 40,
               800.00, 750.00,
               '72 active cases reviewed; 8 closed with positive outcomes; 5 escalated to national CP authority.',
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'CP Case Management Review — Q1 2026'
        );

        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, status, location,
                                age_5_17_female, age_5_17_male,
                                age_18_49_female, age_18_49_male,
                                refugee_south_sudanese,
                                budget, created_by, updated_by)
        SELECT proj_cp, ind_pi_cp1, ta_cp,
               'Child-Friendly Space (CFS) Monthly Activities — February 2026',
               'Structured play, psychosocial activities, and non-formal education for children 5–17 in the Child-Friendly Space.',
               '2026-02-01', 'In Progress', 'Bidibidi Settlement, Zone 1 CFS',
               55, 47, 0, 0,
               80,
               2200.00,
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'Child-Friendly Space (CFS) Monthly Activities — February 2026'
        );
    END IF;

    -- ================================================================
    -- ACTIVITIES — Economic Empowerment Project
    -- ================================================================
    IF proj_emp IS NOT NULL THEN
        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, completion_date, status, location,
                                age_18_49_female, age_18_49_male,
                                age_50_plus_female,
                                refugee_congolese, host_community,
                                budget, actual_cost, notes, created_by, updated_by)
        SELECT proj_emp, ind_pi_emp1, ta_livelihood,
               'VSLA Group Formation and Training — Kyangwali Cluster A',
               'Formation of 9 new VSLA groups (20 members each) covering zones 2, 4, and 6. Includes savings methodology, constitution writing, and election of officers.',
               '2026-01-10', '2026-01-24', 'Completed', 'Kyangwali Settlement, Community Hall',
               162, 18, 18,
               95, 85,
               6800.00, 6520.00,
               '9 groups formed (180 women + 18 men). All groups opened mobile money accounts.',
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'VSLA Group Formation and Training — Kyangwali Cluster A'
        );

        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, completion_date, status, location,
                                age_18_49_female, age_18_49_male, age_50_plus_female,
                                refugee_congolese, host_community,
                                budget, actual_cost, notes, created_by, updated_by)
        SELECT proj_emp, ind_pi_emp2, ta_livelihood,
               'Business Development Skills Training — Module 1 (January 2026)',
               'First of 4 business skills modules covering: business idea generation, market analysis, record-keeping, customer service.',
               '2026-01-15', '2026-01-17', 'Completed', 'Kyangwali Settlement, AWYAD Training Room',
               52, 0, 3,
               35, 20,
               4200.00, 4100.00,
               '55 women completed module 1. Pre/post test shows 68% knowledge improvement.',
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'Business Development Skills Training — Module 1 (January 2026)'
        );

        INSERT INTO activities (project_id, indicator_id, thematic_area_id, activity_name, description,
                                planned_date, status, location,
                                age_18_49_female, age_18_49_male,
                                refugee_congolese, host_community,
                                budget, created_by, updated_by)
        SELECT proj_emp, ind_pi_emp2, ta_livelihood,
               'Business Development Skills Training — Module 2 (February 2026)',
               'Module 2: financial literacy, loan application, digital money management, and business plan development.',
               '2026-02-18', 'Planned', 'Kyangwali Settlement, AWYAD Training Room',
               52, 0, 35, 20,
               4200.00,
               admin_id, admin_id
        WHERE NOT EXISTS (
            SELECT 1 FROM activities
            WHERE activity_name = 'Business Development Skills Training — Module 2 (February 2026)'
        );
    END IF;

    -- ================================================================
    -- CASES — GBV Project
    -- ================================================================
    IF proj_gbv IS NOT NULL THEN
        INSERT INTO cases (case_number, project_id, case_type_id, case_category_id,
                           date_reported, severity, status, location,
                           age_group, gender, nationality,
                           support_offered, case_worker, follow_up_date, notes,
                           created_by, updated_by)
        SELECT 'NKV-GBV-2026-001', proj_gbv,
               (SELECT id FROM case_types WHERE code = 'GBV'),
               (SELECT id FROM case_categories WHERE code = 'GBV_PHYSICAL'),
               '2026-01-08', 'High', 'In Progress', 'Nakivale Settlement, Zone 2',
               '25-34', 'Female', 'Sudanese',
               'PSS counseling enrolled; safety plan developed; legal aid referral made',
               'Amina Nalwoga', '2026-02-08',
               'Survivor relocated to safe house on day 3. Husband arrested by OPM security.',
               admin_id, admin_id
        WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'NKV-GBV-2026-001');

        INSERT INTO cases (case_number, project_id, case_type_id, case_category_id,
                           date_reported, severity, status, location,
                           age_group, gender, nationality,
                           support_offered, case_worker, follow_up_date, notes,
                           created_by, updated_by)
        SELECT 'NKV-GBV-2026-002', proj_gbv,
               (SELECT id FROM case_types WHERE code = 'GBV'),
               (SELECT id FROM case_categories WHERE code = 'GBV_PSYCH'),
               '2026-01-12', 'Medium', 'Open', 'Nakivale Settlement, Base Camp',
               '18-24', 'Female', 'Congolese',
               'Individual PSS counseling sessions x3; group support enrollment pending',
               'Amina Nalwoga', '2026-02-12',
               'Client reluctant to involve family. Building trust through gradual engagement.',
               admin_id, admin_id
        WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'NKV-GBV-2026-002');

        INSERT INTO cases (case_number, project_id, case_type_id, case_category_id,
                           date_reported, severity, status, location,
                           age_group, gender, nationality,
                           support_offered, case_worker, closure_date, notes,
                           created_by, updated_by)
        SELECT 'NKV-GBV-2026-003', proj_gbv,
               (SELECT id FROM case_types WHERE code = 'PSS'),
               (SELECT id FROM case_categories WHERE code = 'PSS_SUPPORT' LIMIT 1),
               '2025-12-15', 'Low', 'Closed', 'Nakivale Settlement, Zone 5',
               '35-49', 'Female', 'South Sudanese',
               'Completed 8-session group PSS program; referred to livelihood project',
               'Grace Aber', '2026-01-20',
               'Positive outcome: survivor joined VSLA group and reports improved wellbeing.',
               admin_id, admin_id
        WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'NKV-GBV-2026-003');
    END IF;

    -- ================================================================
    -- CASES — Child Protection Project
    -- ================================================================
    IF proj_cp IS NOT NULL THEN
        INSERT INTO cases (case_number, project_id, case_type_id, case_category_id,
                           date_reported, severity, status, location,
                           age_group, gender, nationality,
                           support_offered, case_worker, follow_up_date, notes,
                           created_by, updated_by)
        SELECT 'BDD-CP-2026-001', proj_cp,
               (SELECT id FROM case_types WHERE code = 'CP'),
               (SELECT id FROM case_categories WHERE code = 'CP_ABUSE' LIMIT 1),
               '2026-01-05', 'High', 'In Progress', 'Bidibidi Settlement, Zone 1',
               '10-14', 'Female', 'South Sudanese',
               'Safety assessment completed; placed with foster family; school enrolled',
               'John Odongo', '2026-02-05',
               'Referred by CPV. Parents traced to South Sudan. Repatriation process initiated.',
               admin_id, admin_id
        WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'BDD-CP-2026-001');

        INSERT INTO cases (case_number, project_id, case_type_id, case_category_id,
                           date_reported, severity, status, location,
                           age_group, gender, nationality,
                           support_offered, case_worker, follow_up_date, notes,
                           created_by, updated_by)
        SELECT 'BDD-CP-2026-002', proj_cp,
               (SELECT id FROM case_types WHERE code = 'CP'),
               (SELECT id FROM case_categories WHERE code = 'CP_NEGLECT' LIMIT 1),
               '2026-01-11', 'Medium', 'Open', 'Bidibidi Settlement, Zone 3',
               '5-9', 'Male', 'South Sudanese',
               'Case assessment in progress; CFS enrollment; nutritional support referral',
               'John Odongo', '2026-02-11',
               'Child found wandering unattended. Mother located — single parent under stress. Family support plan in development.',
               admin_id, admin_id
        WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'BDD-CP-2026-002');

        INSERT INTO cases (case_number, project_id, case_type_id, case_category_id,
                           date_reported, severity, status, location,
                           age_group, gender, nationality,
                           support_offered, case_worker, follow_up_date, notes,
                           created_by, updated_by)
        SELECT 'BDD-CP-2026-003', proj_cp,
               (SELECT id FROM case_types WHERE code = 'EDU'),
               (SELECT id FROM case_categories WHERE code = 'EDU_FEES' LIMIT 1),
               '2026-01-14', 'Low', 'Open', 'Bidibidi Settlement, Zone 2',
               '10-14', 'Male', 'Congolese',
               'School fees gap identified; application to education fund submitted; temporary home-learning kit provided',
               'Sarah Akello', '2026-02-14',
               'Bright student unable to attend secondary school due to fees. Fund application in review.',
               admin_id, admin_id
        WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'BDD-CP-2026-003');
    END IF;

    RAISE NOTICE 'Demo 2026 seed completed successfully.';
    RAISE NOTICE 'Projects: GBV Nakivale, CP Bidibidi, Economic Empowerment Kyangwali';
    RAISE NOTICE 'Org indicators: ORG-GBV-01, ORG-CP-01, ORG-EMP-01';
    RAISE NOTICE 'Project indicators: PI-GBV-01/02, PI-CP-01/02, PI-EMP-01/02';

END $$;

COMMIT;

-- ============================================================
-- Summary query
-- ============================================================
SELECT
    'Projects (2026 demo)'  AS entity, COUNT(*) AS count
    FROM projects WHERE name LIKE '%2026%'
UNION ALL
SELECT 'AWYAD-level Indicators', COUNT(*)
    FROM indicators WHERE indicator_scope = 'awyad'
UNION ALL
SELECT 'Project-level Indicators', COUNT(*)
    FROM indicators WHERE indicator_scope = 'project'
UNION ALL
SELECT 'Indicator Mappings', COUNT(*)
    FROM indicator_mappings
UNION ALL
SELECT 'Activities (2026)', COUNT(*)
    FROM activities WHERE planned_date >= '2026-01-01'
UNION ALL
SELECT 'Cases (2026)', COUNT(*)
    FROM cases WHERE date_reported >= '2026-01-01';
