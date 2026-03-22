-- Simple Demo Data
-- Matches actual database schema

BEGIN;

-- Admin user UUID
-- 39d21083-caed-4a8f-9476-6db6fdc8784c

-- Thematic Areas
INSERT INTO thematic_areas (code, name, description, created_by, updated_by) VALUES
('RESULT 2', 'GBV and Protection Response', 
 'Local partners respond to GBV and protection risks among new arrivals',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('RESULT 3', 'Child Protection Response',
 'Local partners respond to Child Protection risks among new arrivals',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Projects (no code column in schema)
INSERT INTO projects (name, donor, thematic_area_id, status, start_date, end_date, budget, locations, description, created_by, updated_by) VALUES
('GBV Response Program', 'UNFPA', 
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'), 
 'Active', '2024-01-15', '2025-12-31', 500000.00, 
 ARRAY['Nakivale', 'Kampala', 'Nyakabande'],
 'Comprehensive GBV prevention and response services',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('Child Protection Program', 'UNICEF',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'Active', '2024-03-01', '2026-02-28', 420000.00,
 ARRAY['Nakivale', 'Kampala'],
 'Child protection services including case management',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Indicators
INSERT INTO indicators (code, name, description, type, thematic_area_id, target, baseline, unit, created_by, updated_by) VALUES
('I.2.1', 'Survivors receiving GBV response', 
 'Number of survivors who receive appropriate GBV response services',
 'outcome', 
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 550, 0, 'Individuals',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('I.2.2', 'Participants with protection knowledge',
 'Number of participants with increased knowledge of protection mechanisms',
 'outcome',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 130, 0, 'Individuals',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('I.3.1', 'Children in case management',
 'Number of children receiving case management services',
 'outcome',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 1000, 0, 'Individuals',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('I.3.2', 'Families reunified',
 'Number of separated children reunified with families',
 'output',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 50, 0, 'Families',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Activities
INSERT INTO activities (
    thematic_area_id, indicator_id, project_id, activity_name, description,
    planned_date, completion_date, status, location,
    direct_male, direct_female, direct_other,
    indirect_male, indirect_female, indirect_other,
    budget, actual_cost, notes,
    created_by, updated_by
) VALUES
-- GBV Activity 1
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE name = 'GBV Response Program'),
 'Community conversations on GBV prevention',
 'Interactive community dialogues on GBV prevention and response',
 '2024-10-01', '2024-11-15', 'Completed', 'Nakivale, Kampala',
 123, 401, 8,
 0, 0, 0,
 42000.00, 34020.00, 'High community engagement and participation',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
-- GBV Activity 2
((SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE name = 'GBV Response Program'),
 'Frontline worker training on GBV response',
 'Training for community health workers and case managers',
 '2024-09-15', '2024-10-20', 'Completed', 'Kampala',
 84, 56, 0,
 0, 0, 0,
 28000.00, 24500.00, 'Excellent training outcomes',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
-- CP Activity 1
((SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 (SELECT id FROM indicators WHERE code = 'I.3.1'),
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 'Child protection case assessments',
 'Comprehensive assessments for children at risk',
 '2024-08-01', '2024-10-20', 'Completed', 'Nakivale, Kampala',
 378, 378, 0,
 0, 0, 0,
 50000.00, 37800.00, 'Ongoing case management support',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
-- CP Activity 2
((SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 (SELECT id FROM indicators WHERE code = 'I.3.2'),
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 'Family reunification services',
 'Tracing and reunification of separated children with families',
 '2024-09-01', NULL, 'In Progress', 'Nakivale',
 20, 18, 0,
 0, 0, 0,
 35000.00, 22000.00, 'Active tracing and assessment ongoing',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- Cases
INSERT INTO cases (
    case_number, project_id, date_reported, case_type, severity, status, location,
    age_group, gender, service_provided, follow_up_date, closure_date, notes,
    created_by, updated_by
) VALUES
('GBV-NK-2025-001',
 (SELECT id FROM projects WHERE name = 'GBV Response Program'),
 '2025-01-10', 'Sexual Assault', 'High', 'Open', 'Nakivale',
 '25-34', 'Female', 'Psychosocial support, Medical care, Legal aid',
 '2025-02-15', NULL, 'Survivor receiving comprehensive support services',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('GBV-KLA-2025-002',
 (SELECT id FROM projects WHERE name = 'GBV Response Program'),
 '2024-12-15', 'Domestic Violence', 'Medium', 'Closed', 'Kampala',
 '35-44', 'Female', 'Safety planning, Shelter, Legal support',
 '2024-12-30', '2025-01-05', 'Case successfully resolved, client relocated to safe shelter',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('CP-NK-2025-003',
 (SELECT id FROM projects WHERE name = 'Child Protection Program'),
 '2025-01-08', 'Child Abuse', 'Critical', 'Open', 'Nakivale',
 '10-14', 'Male', 'Case management, Temporary care, Family assessment',
 '2025-02-10', NULL, 'Child in protective care, ongoing family assessment and support',
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
