-- Complete Demo Data - Matching Original Demo
-- Admin UUID: 39d21083-caed-4a8f-9476-6db6fdc8784c

BEGIN;

-- Thematic Areas
INSERT INTO thematic_areas (code, name, description, created_by, updated_by) VALUES
('RESULT 2', 'Local partners effectively respond to GBV and prot...', 
 'Local partners effectively respond to GBV and protection risks among new arrivals appropriate to their age, gender, and disability.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('RESULT 3', 'Local partners effectively respond to Child Protec...',
 'Local partners effectively respond to Child Protection risks among new arrivals appropriate to their age, gender, and disability',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Projects with expenditure
INSERT INTO projects (name, donor, thematic_area_id, status, start_date, end_date, budget, expenditure, locations, description, created_by, updated_by) VALUES
('GBV Response and Protection', 'UNFPA', 
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'), 
 'Active', '2024-01-15', '2025-12-31', 500000.00, 312500.00,
 ARRAY['Nakivale', 'Kampala', 'Nyakabande'],
 'Comprehensive GBV prevention and response services for refugees and host communities',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('Child Protection Program', 'UNICEF',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'Active', '2024-03-01', '2026-02-28', 420000.00, 158200.00,
 ARRAY['Nakivale', 'Kampala'],
 'Child protection services including case management, family reunification, and community-based protection',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- All 11 Indicators from original demo
INSERT INTO indicators (code, name, description, type, thematic_area_id, target, baseline, unit, reporting_frequency, created_by, updated_by) VALUES
-- GBV Indicators (5)
('I.2.1', 'Indicator 1 Number of survivors who receive an appropriate response to GBV', 
 'Survivors receiving comprehensive GBV response services including psychosocial, medical, and legal support',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 550, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.2.2', 'Indicator 2 Number of participants showing an increased knowledge on the protection subject in focus',
 'Participants demonstrating improved understanding of protection mechanisms and GBV prevention',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 130, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.2.3', 'Indicator 3 Number of persons effectively referred to other specialised service or assistance providers',
 'Persons successfully referred and connected to specialized service providers',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 550, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.2.4', 'Indicator 4 Number of persons with increased/appropriate information on relevant rights and/or entitlements',
 'Persons receiving accurate information about their rights, entitlements, and available services',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 25, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.2.5', 'Indicator 5 Percentage of women and girls with specific protection needs who report feeling safe and supported',
 'Women and girls (survivors of GBV, PWDs, pregnant/lactating) reporting increased safety after accessing safe spaces',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 4500, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- Child Protection Indicators (6)
('I.3.1', 'Indicator 1: Number of persons who receive an appropriate response',
 'Children and families receiving appropriate child protection response services',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 1350, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.3.2', 'Indicator 2: Number of unaccompanied/separated children reunited with caregivers OR in protective arrangements',
 'UASC reunified with families or placed in appropriate alternative care based on Best Interest Assessment',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 10, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.3.3', 'Indicator 3: Number of participants showing an increased knowledge on the protection subject in focus',
 'Participants demonstrating improved understanding of child protection principles and practices',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 150, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.3.4', 'Indicator 4: Number of parents, caregivers, foster families trained to address child protection concerns',
 'Caregivers receiving training, guidance and support on addressing child protection issues',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 350, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.3.5', 'Indicator 5: Number of functional community action plans developed for CP concerns',
 'Community-developed action plans to address specific child protection concerns',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 2, 0, 'Plans', 'Annual',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('I.3.6', 'Indicator 6: Number of children/parents reached by environmental conservation initiatives',
 'Children and caregivers engaged in environmental conservation activities',
 'outcome', (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 2800, 0, 'Individuals', 'Quarterly',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Activities with disaggregation
INSERT INTO activities (
    thematic_area_id, indicator_id, project_id, activity_name, description,
    planned_date, completion_date, status, location,
    direct_male, direct_female, direct_other,
    indirect_male, indirect_female, indirect_other,
    budget, actual_cost, notes,
    created_by, updated_by
) VALUES
-- ACT-001: SASA Assessment
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Conduct SASA community Assessment to inform roll out of Support Phase',
 'Community assessment using SASA methodology to identify GBV prevention needs and opportunities',
 '2025-01-15', NULL, 'Planned', 'Nakivale, Kampala',
 0, 0, 0, 0, 0, 0,
 100.00, 0.00, 'Assessment planned for early 2025 to guide SASA implementation',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-002: SASA Implementation (High achievement)
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Support selected CSOs and community structures in implementing evidence-based SASA approach',
 'Community conversations and SASA methodology implementation with local CSOs and community structures',
 '2024-09-01', '2024-11-15', 'Completed', 'Nakivale, Kampala',
 287, 286, 0, 190, 190, 0,
 50000.00, 40800.00, 'Excellent participation: 573 refugees (287M, 286F) and 380 host community (190M, 190F). Nationalities: Sudanese 257, Congolese 171, S.Sudanese 114',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-003: Positive Masculinities
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.4'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Conduct social sensitization on positive masculinities and parenting',
 'Social sensitization sessions on positive masculinity, fatherhood, and non-violent parenting',
 '2024-10-01', NULL, 'In Progress', 'Nakivale, Kampala',
 171, 170, 0, 113, 113, 0,
 47000.00, 24395.00, 'Target: 470, Achieved: 567 (61% progress). Mixed refugee and host participation across age groups',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-004: RWC Training
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 'Engage and train refugee welfare committee members on GBV',
 'Training refugee welfare committee members on GBV prevention, response, and referral mechanisms',
 '2024-11-01', NULL, 'Pending', 'Nakivale, Kampala',
 33, 33, 0, 21, 20, 0,
 20100.00, 4930.00, 'Target: 201, Achieved: 107 (29% progress). Committee member training ongoing',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-005: Facilitate BIA trainings
((SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 (SELECT id FROM indicators WHERE code = 'I.3.1'),
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 'Facilitate Best Interest Assessment (BIA) trainings for case workers',
 'Training case workers on conducting comprehensive Best Interest Assessments for children at risk',
 '2024-08-15', '2024-09-20', 'Completed', 'Nakivale, Kampala',
 156, 273, 0, 0, 0, 0,
 42900.00, 36465.00, 'Achievement: 429 (156M, 273F). Excellent capacity building for CP case workers',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

-- ACT-006: Child Protection Committees
((SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 (SELECT id FROM indicators WHERE code = 'I.3.4'),
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 'Support establishment and strengthening of community-based child protection committees',
 'Establishing and training community-based child protection committees for prevention and response',
 '2024-09-01', '2024-11-30', 'Completed', 'Nakivale',
 433, 433, 0, 0, 0, 0,
 86600.00, 73610.00, 'Achievement: 866 (433M, 433F) - 247% of target. Strong community engagement',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Cases
INSERT INTO cases (
    case_number, project_id, date_reported, case_type, severity, status, location,
    age_group, gender, service_provided, follow_up_date, closure_date, notes,
    created_by, updated_by
) VALUES
('GBV-NK-2025-001',
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 '2025-01-10', 'Sexual Assault', 'Critical', 'Open', 'Nakivale Settlement',
 '25-34', 'Female', 'Psychosocial support, Medical care, Legal aid, Safe shelter referral',
 '2025-02-15', NULL, 'Survivor receiving comprehensive support. Case worker: Jane Doe. Regular counseling sessions ongoing. Police case filed.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('GBV-KLA-2025-002',
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 '2024-12-15', 'Domestic Violence', 'High', 'Closed', 'Kampala',
 '35-44', 'Female', 'Safety planning, Legal support, Economic empowerment, Counseling',
 '2024-12-30', '2025-01-05', 'Case successfully resolved. Client relocated to safe environment. Legal protection order obtained. Economic support initiated.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('CP-NK-2025-003',
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 '2025-01-08', 'Child Abuse', 'Critical', 'Open', 'Nakivale Settlement',
 '10-14', 'Male', 'Case management, Temporary care, BIA, Family assessment, Psychosocial support',
 '2025-02-10', NULL, 'UASC in temporary care pending family reunification. BIA completed. Tracing ongoing. Case worker: Sarah Johnson.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('CP-KLA-2025-004',
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 '2024-11-20', 'Family Separation', 'High', 'Closed', 'Kampala',
 '5-9', 'Female', 'Family tracing, Reunification, Post-reunification follow-up',
 '2024-12-15', '2024-12-28', 'Successful family reunification. Child reunited with biological mother. Post-reunification monitoring completed. Case closed successfully.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('GBV-NK-2025-005',
 (SELECT id FROM projects WHERE name = 'GBV Response and Protection'),
 '2024-12-20', 'Early/Forced Marriage', 'High', 'Open', 'Nakivale Settlement',
 '15-17', 'Female', 'Psychosocial support, Legal aid, Safe shelter, Education support',
 '2025-01-20', NULL, 'Minor at risk of forced marriage. Protective measures in place. Legal intervention initiated. Family counseling ongoing.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),

('CP-NK-2025-006',
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 '2024-12-05', 'Child Labor', 'Medium', 'Open', 'Nakivale Settlement',
 '10-14', 'Male', 'Case management, Education enrollment, Family economic support',
 '2025-01-05', NULL, 'Child engaged in hazardous labor. Enrolled in school. Family receiving livelihood support to prevent return to labor.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

COMMIT;

-- Summary
SELECT 
  'Thematic Areas' as entity, COUNT(*) as count 
FROM thematic_areas WHERE created_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects WHERE created_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Indicators', COUNT(*) FROM indicators WHERE created_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Activities', COUNT(*) FROM activities WHERE created_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Cases', COUNT(*) FROM cases WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY entity;
