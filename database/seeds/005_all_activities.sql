-- All 10 Activities from Original Demo
-- Admin UUID: 39d21083-caed-4a8f-9476-6db6fdc8784c

BEGIN;

-- Get project and indicator IDs for reference
-- GBV Project: 'GBV Response and Protection'
-- CP Project: 'Child Protection Program'

INSERT INTO activities (
    thematic_area_id, indicator_id, project_id, activity_name, description,
    planned_date, completion_date, status, location,
    direct_male, direct_female, direct_other,
    indirect_male, indirect_female, indirect_other,
    budget, actual_cost, notes,
    created_by, updated_by
) VALUES
-- ACT-001: SASA Assessment (Pending)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Conduct SASA community Assessment to inform roll out of Support Phase',
 'Community assessment using SASA methodology to identify GBV prevention needs',
 '2025-01-15', NULL, 'Planned', 'Nakivale, Kampala',
 0, 0, 0, 0, 0, 0,
 100.00, 0.00, 'Assessment planned for early 2025. Activity Code: 3.2.1',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-002: SASA Implementation (Completed - High Achievement 480/50)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Support selected CSOs and community structures in implementing evidence-based SASA approach',
 'Community conversations using SASA methodology with local CSOs',
 '2024-09-01', '2024-11-15', 'Completed', 'Nakivale, Kampala',
 287, 286, 0, 190, 190, 0,
 50000.00, 40800.00, 'Achievement: 953 total (573 refugees, 380 host). Nationalities: Sudanese 257, Congolese 171, S.Sudanese 114. Activity Code: 3.2.3',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-003: Positive Masculinities (In Progress 287/470)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.4'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Conduct social sensitization on positive masculinities and parenting',
 'Social sensitization on positive masculinity, fatherhood, and non-violent parenting',
 '2024-10-01', NULL, 'In Progress', 'Nakivale, Kampala',
 171, 170, 0, 113, 113, 0,
 47000.00, 24395.00, 'Progress: 567/470 (121%). Mixed refugee/host participation. Activity Code: 3.2.4',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-004: RWC Training (Pending 58/201)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Engage and train refugee welfare committee members on GBV',
 'Training RWC members on GBV prevention, response, and referral mechanisms',
 '2024-11-01', NULL, 'Pending', 'Nakivale, Kampala',
 33, 33, 0, 21, 20, 0,
 20100.00, 4930.00, 'Progress: 107/201 (29%). Committee member training ongoing. Activity Code: 3.2.5',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-005: Religious Leaders Training (Completed 53/50)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.4'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Engage and train religious and cultural leaders on GBV prevention',
 'Training religious and cultural leaders to become GBV prevention champions',
 '2024-08-15', '2024-09-20', 'Completed', 'Nakivale, Kampala',
 29, 29, 0, 19, 19, 0,
 5000.00, 4505.00, 'Achievement: 96/50 (192%). Refugees 58, Host 38. Activity Code: 3.2.6',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-006: International Events (Completed 302/4)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Commemorate international events (IWD, World Refugee Day, 16 Days)',
 'Community mobilization for International Women Day, World Refugee Day, 16 Days campaign',
 '2024-06-15', '2024-12-10', 'Completed', 'Nakivale, Kampala',
 180, 180, 0, 119, 119, 0,
 400.00, 25670.00, 'Achievement: 598/4 (14,950%!). Major community engagement. Refugees 360, Host 238. Activity Code: 3.2.7',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-007: Community Policing (Completed 229/5)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.3'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Strengthen community policing for women and girls safety',
 'Strengthening community policing mechanisms for enhanced safety of women and girls',
 '2024-07-01', '2024-10-30', 'Completed', 'Nakivale, Kampala',
 135, 135, 0, 90, 89, 0,
 500.00, 19465.00, 'Achievement: 449/5 (8,980%!). Refugees 270, Host 179. Activity Code: 3.2.8',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-008: Skills Training (Completed 99/80)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.5'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Support out-of-school girls with non-formal skills training',
 'Non-formal skills training for out-of-school adolescent girls and young women',
 '2024-05-01', '2024-08-30', 'Completed', 'Nakivale, Kampala',
 56, 56, 0, 37, 37, 0,
 8000.00, 8415.00, 'Achievement: 186/80 (233%). Refugees 112, Host 74. Activity Code: 3.3.1',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-009: Case Management PEP (Pending 48/300)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Support case management response interventions (PEP, case conferencing)',
 'Case management support including PEP, case conferencing, and survivor support',
 '2025-01-20', NULL, 'Pending', 'Nakivale, Kampala',
 27, 26, 0, 17, 16, 0,
 30000.00, 4080.00, 'Progress: 86/300 (29%). Ongoing case management. Activity Code: 4.1.1',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-010: Multisectoral Referrals (Pending 51/300)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.3'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Provide multisectoral support to GBV survivors through referrals',
 'Multisectoral referral support for GBV survivors to health, legal, and protection services',
 '2025-01-25', NULL, 'Pending', 'Nakivale, Kampala',
 29, 29, 0, 19, 19, 0,
 30000.00, 4335.00, 'Progress: 96/300 (32%). Referral system active. Activity Code: 4.1.5',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

COMMIT;

-- Summary
SELECT COUNT(*) as total_activities FROM activities;
