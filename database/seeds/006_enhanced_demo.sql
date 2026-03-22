-- Enhanced Demo Data - Simple version for existing schema
-- Adds approved activities, beneficiary data, and January 2026 activities

BEGIN;

-- Update some existing activities with approved status and beneficiary data
UPDATE activities SET
    approval_status = 'Approved',
    refugee_male_0_11 = 25,
    refugee_female_0_11 = 30,
    refugee_male_12_17 = 15,
    refugee_female_12_17 = 20,
    refugee_male_18_59 = 40,
    refugee_female_18_59 = 45,
    refugee_male_60 = 5,
    refugee_female_60 = 8,
    host_male_0_11 = 10,
    host_female_0_11 = 12,
    host_male_12_17 = 8,
    host_female_12_17 = 10,
    host_male_18_59 = 20,
    host_female_18_59 = 25,
    host_male_60 = 3,
    host_female_60 = 4,
    nationality_sudanese = 150,
    nationality_congolese = 80,
    nationality_south_sudanese = 40,
    nationality_others = 10,
    total_beneficiaries = 280
WHERE id IN (
    SELECT id FROM activities ORDER BY date DESC LIMIT 4
);

-- Add 3 new activities for January 2026 (current month)
INSERT INTO activities (
    project_id, indicator_id, thematic_area_id, activity_name, 
    description, location, date, status, approval_status,
    budget, expenditure,
    refugee_male_0_11, refugee_female_0_11,
    refugee_male_12_17, refugee_female_12_17,
    refugee_male_18_59, refugee_female_18_59,
    refugee_male_60, refugee_female_60,
    host_male_0_11, host_female_0_11,
    host_male_12_17, host_female_12_17,
    host_male_18_59, host_female_18_59,
    host_male_60, host_female_60,
    nationality_sudanese, nationality_congolese, nationality_south_sudanese, nationality_others,
    total_beneficiaries, achievements, challenges, next_steps,
    created_by, updated_by
) VALUES
-- Activity 1: GBV Awareness Session (January 2026)
(
    (SELECT id FROM projects WHERE name LIKE 'GBV Response%' LIMIT 1),
    (SELECT id FROM indicators WHERE code = 'I.2.2' LIMIT 1),
    (SELECT id FROM thematic_areas WHERE code = 'RESULT 2' LIMIT 1),
    'GBV Awareness and Prevention Training - January 2026',
    'Community awareness session on GBV prevention, survivor support services, and referral pathways',
    'Nakivale Settlement, Base Camp', '2026-01-15', 'Completed', 'Approved',
    5000.00, 4800.00,
    0, 5,  -- Refugee 0-11
    3, 8,  -- Refugee 12-17
    12, 35, -- Refugee 18-59
    2, 5,  -- Refugee 60+
    0, 2,  -- Host 0-11
    2, 3,  -- Host 12-17
    8, 15, -- Host 18-59
    1, 2,  -- Host 60+
    60, 30, 12, 1,  -- Nationalities
    103,  -- Total beneficiaries
    'Successfully conducted awareness session with high community participation. Survivors reported increased awareness of available services.',
    'Limited male participation due to cultural barriers. Transportation costs higher than budgeted.',
    'Plan follow-up session targeting male community leaders. Request budget adjustment for transportation.',
    '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'
),

-- Activity 2: Child Protection Case Management (January 2026)
(
    (SELECT id FROM projects WHERE name LIKE 'Child Protection%' LIMIT 1),
    (SELECT id FROM indicators WHERE code = 'I.3.1' LIMIT 1),
    (SELECT id FROM thematic_areas WHERE code = 'RESULT 3' LIMIT 1),
    'Case Management for UASC - January 2026',
    'Individual case management for unaccompanied and separated children including Best Interest Assessment',
    'Nakivale Settlement, Rubondo', '2026-01-20', 'Completed', 'Approved',
    8000.00, 7500.00,
    12, 15, -- Refugee 0-11
    18, 22, -- Refugee 12-17
    0, 0,   -- Refugee 18-59 (children only)
    0, 0,   -- Refugee 60+
    5, 6,   -- Host 0-11
    8, 10,  -- Host 12-17
    0, 0,   -- Host 18-59
    0, 0,   -- Host 60+
    50, 35, 10, 1,  -- Nationalities
    96,  -- Total beneficiaries
    'Completed BIA for 15 UASC. Successfully reunified 3 children with extended family members. Identified 8 cases requiring urgent psychosocial support.',
    'Delay in obtaining documentation for 2 UASC. Limited foster care options in settlement.',
    'Follow-up on documentation with relevant authorities. Recruit and train additional foster families.',
    '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'
),

-- Activity 3: Psychosocial Support (January 2026)
(
    (SELECT id FROM projects WHERE name LIKE 'GBV Response%' LIMIT 1),
    (SELECT id FROM indicators WHERE code = 'I.2.1' LIMIT 1),
    (SELECT id FROM thematic_areas WHERE code = 'RESULT 2' LIMIT 1),
    'Psychosocial Support Services - January 2026',
    'Individual and group psychosocial support for GBV survivors including counseling and referral to medical services',
    'Kampala, Kisenyi', '2026-01-25', 'In Progress', 'Approved',
    6500.00, 2100.00,
    2, 8,   -- Refugee 0-11
    5, 12,  -- Refugee 12-17
    8, 38,  -- Refugee 18-59
    1, 6,   -- Refugee 60+
    1, 3,   -- Host 0-11
    2, 5,   -- Host 12-17
    4, 18,  -- Host 18-59
    0, 2,   -- Host 60+
    65, 28, 15, 7,  -- Nationalities
    115,  -- Total beneficiaries
    'Provided counseling to 45 survivors. Established peer support group with 20 members. Referred 12 cases to medical services.',
    'High demand exceeds available counselor capacity. Some survivors reluctant to participate in group sessions.',
    'Request additional counselor allocation. Develop one-on-one counseling schedule. Create safe women-only group sessions.',
    '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'
);

COMMIT;

-- Verification queries
SELECT 'Enhanced Demo Data Loaded Successfully' as message;
SELECT 'Approved Activities:' as section, COUNT(*) as count FROM activities WHERE approval_status = 'Approved';
SELECT 'January 2026 Activities:' as section, COUNT(*) as count FROM activities WHERE date >= '2026-01-01' AND date < '2026-02-01';
SELECT 'Activities with Beneficiaries:' as section, COUNT(*) as count FROM activities WHERE total_beneficiaries > 0;
