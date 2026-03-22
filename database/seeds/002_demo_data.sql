-- ================================================
-- AWYAD MES - Demo Data Seed Script
-- ================================================
-- This script populates the database with realistic demo data
-- from the original mockData for testing and demonstration
-- ================================================

BEGIN;

-- ================================================
-- 1. THEMATIC AREAS
-- ================================================
INSERT INTO thematic_areas (code, name, description, created_by, updated_by) VALUES
('RESULT 2', 
 'Local partners effectively respond to GBV and prot...', 
 'Local partners effectively respond to GBV and protection risks among new arrivals appropriate to their age, gender, and disability.',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c'),
('RESULT 3', 
 'Local partners effectively respond to Child Protec...', 
 'Local partners effectively respond to Child Protection risks among new arrivals appropriate to their age, gender, and disability',
 '39d21083-caed-4a8f-9476-6db6fdc8784c', '39d21083-caed-4a8f-9476-6db6fdc8784c');

-- ================================================
-- 2. PROJECTS
-- ================================================
INSERT INTO projects (name, code, donor, thematic_area_id, status, start_date, end_date, budget, locations, created_by, updated_by) VALUES
('GBV Response and Protection',
 'PRJ-001',
 'UNFPA',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 'active',
 '2024-01-15',
 '2025-12-31',
 500000.00,
 ARRAY['Nakivale', 'Kampala', 'Nyakabande'],
 1, 1),
('Child Protection Program',
 'PRJ-002',
 'UNICEF',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'active',
 '2024-03-01',
 '2026-02-28',
 420000.00,
 ARRAY['Nakivale', 'Kampala'],
 1, 1);

-- ================================================
-- 3. INDICATORS
-- ================================================
INSERT INTO indicators (
  code, name, thematic_area_id, indicator_type, baseline, baseline_date,
  lop_target, annual_target, unit, q1_target, q2_target, q3_target, q4_target,
  project_id, created_by, updated_by
) VALUES
-- GBV Indicators (Project 1)
('I.2.1',
 'Indicator 1 Number of survivors who receive an appropriate response to GBV',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 'outcome',
 0, '2024-01-01',
 550, 550, 'Individuals',
 137, 137, 137, 137,
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 1, 1),
('I.2.2',
 'Indicator 2 Number of participants showing an increased knowledge on the protection subject in focus',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 'outcome',
 0, '2024-01-01',
 130, 130, 'Individuals',
 32, 32, 32, 32,
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 1, 1),
('I.2.3',
 'Indicator 3 Number of people (children & adults) reached by community-based protection/ GBV prevention interventions',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 'outcome',
 0, '2024-01-01',
 1500, 1500, 'Individuals',
 375, 375, 375, 375,
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 1, 1),
('I.2.4',
 'Indicator 4 Number of protection/ GBV service delivery locations assessed against safe programming standards',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 'outcome',
 0, '2024-01-01',
 4, 4, 'Locations',
 1, 1, 1, 1,
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 1, 1),
('I.2.5',
 'Indicator 5 Number of community-based protection committee members trained and actively participating in protection programs',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 2'),
 'outcome',
 0, '2024-01-01',
 60, 60, 'Individuals',
 15, 15, 15, 15,
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 1, 1),
-- Child Protection Indicators (Project 2)
('I.3.1',
 'Indicator 1 Number of children provided with child protection case management services',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'outcome',
 0, '2024-01-01',
 1000, 1000, 'Individuals',
 250, 250, 250, 250,
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1, 1),
('I.3.2',
 'Indicator 2 Number of children reunified with/ placed in family-based care',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'outcome',
 0, '2024-01-01',
 50, 50, 'Individuals',
 12, 12, 12, 12,
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1, 1),
('I.3.3',
 'Indicator 3 Number of children with disabilities who are fully included in UCRNN funded protection programs',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'outcome',
 0, '2024-01-01',
 150, 150, 'Individuals',
 37, 37, 37, 37,
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1, 1),
('I.3.4',
 'Indicator 4 Number of parents, caregivers, foster families, and community stakeholders who receive training, guidance and support to address child protection concerns',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'outcome',
 0, '2024-01-01',
 350, 350, 'Individuals',
 87, 87, 87, 87,
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1, 1),
('I.3.5',
 'Indicator 5 Number of functional community action plans developed by communities to address specific CP concerns in their communities',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'outcome',
 0, '2024-01-01',
 2, 2, 'Plans',
 0, 0, 0, 0,
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1, 1),
('I.3.6',
 'Indicator 6 Number of children and parents/caregiver who have been reached by environmental conservation initiatives',
 (SELECT id FROM thematic_areas WHERE code = 'RESULT 3'),
 'outcome',
 0, '2024-01-01',
 2800, 2800, 'Individuals',
 700, 700, 700, 700,
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1, 1);

-- ================================================
-- 4. ACTIVITIES
-- ================================================
INSERT INTO activities (
  activity_code, name, indicator_id, project_id, target, achieved,
  status, activity_date, location, reported_by, approval_status,
  budget, expenditure, disaggregation, created_by, updated_by
) VALUES
-- GBV Activities
('3.2.1',
 'Conduct SASA community Assessment to inform roll out of Support Phase',
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 1, 0,
 'pending',
 '2025-01-15',
 'Nakivale, Kampala',
 'Field Officer',
 'pending',
 100.00, 0.00,
 '{
   "refugee": {"male": {"0-4": 0, "5-17": 0, "18-49": 0, "50+": 0}, "female": {"0-4": 0, "5-17": 0, "18-49": 0, "50+": 0}},
   "host": {"male": {"0-4": 0, "5-17": 0, "18-49": 0, "50+": 0}, "female": {"0-4": 0, "5-17": 0, "18-49": 0, "50+": 0}}
 }'::jsonb,
 1, 1),
('3.2.2',
 'Conduct community conversations on GBV prevention and response',
 (SELECT id FROM indicators WHERE code = 'I.2.1'),
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 700, 567,
 'completed',
 '2024-11-15',
 'Nakivale, Kampala',
 'Community Mobilizer',
 'approved',
 42000.00, 34020.00,
 '{
   "refugee": {"male": {"0-4": 17, "5-17": 43, "18-49": 86, "50+": 25}, "female": {"0-4": 17, "5-17": 51, "18-49": 77, "50+": 25}},
   "host": {"male": {"0-4": 9, "5-17": 25, "18-49": 62, "50+": 17}, "female": {"0-4": 9, "5-17": 28, "18-49": 59, "50+": 17}}
 }'::jsonb,
 1, 1),
('3.2.3',
 'Training of frontline workers on GBV case management',
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 542, 341,
 'in_progress',
 '2024-12-10',
 'Nakivale, Kampala, Nyakabande',
 'Training Coordinator',
 'approved',
 54200.00, 34100.00,
 '{
   "refugee": {"male": {"0-4": 17, "5-17": 43, "18-49": 86, "50+": 25}, "female": {"0-4": 17, "5-17": 51, "18-49": 77, "50+": 25}},
   "host": {"male": {"0-4": 9, "5-17": 25, "18-49": 62, "50+": 17}, "female": {"0-4": 9, "5-17": 28, "18-49": 59, "50+": 17}}
 }'::jsonb,
 1, 1),
('3.2.5',
 'Engage and train refugee welfare committee members on GBV',
 (SELECT id FROM indicators WHERE code = 'I.2.2'),
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 201, 58,
 'pending',
 '2025-01-15',
 'Nakivale, Kampala',
 'Field Officer',
 'pending',
 20100.00, 4930.00,
 '{
   "refugee": {"male": {"0-4": 3, "5-17": 8, "18-49": 17, "50+": 5}, "female": {"0-4": 3, "5-17": 10, "18-49": 15, "50+": 5}},
   "host": {"male": {"0-4": 1, "5-17": 5, "18-49": 12, "50+": 3}, "female": {"0-4": 1, "5-17": 5, "18-49": 11, "50+": 3}}
 }'::jsonb,
 1, 1),
-- Child Protection Activities
('4.1.1',
 'Conduct child protection case assessments',
 (SELECT id FROM indicators WHERE code = 'I.3.1'),
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 1000, 756,
 'in_progress',
 '2024-10-20',
 'Nakivale, Kampala',
 'Case Manager',
 'approved',
 50000.00, 37800.00,
 '{
   "refugee": {"male": {"0-4": 89, "5-17": 156, "18-49": 45, "50+": 0}, "female": {"0-4": 78, "5-17": 167, "18-49": 34, "50+": 0}},
   "host": {"male": {"0-4": 45, "5-17": 89, "18-49": 23, "50+": 0}, "female": {"0-4": 34, "5-17": 98, "18-49": 18, "50+": 0}}
 }'::jsonb,
 1, 1),
('4.1.2',
 'Facilitate family reunification processes',
 (SELECT id FROM indicators WHERE code = 'I.3.2'),
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 50, 38,
 'in_progress',
 '2024-11-05',
 'Nakivale',
 'Family Tracing Officer',
 'approved',
 15000.00, 11400.00,
 '{
   "refugee": {"male": {"0-4": 8, "5-17": 12, "18-49": 0, "50+": 0}, "female": {"0-4": 7, "5-17": 11, "18-49": 0, "50+": 0}},
   "host": {"male": {"0-4": 0, "5-17": 0, "18-49": 0, "50+": 0}, "female": {"0-4": 0, "5-17": 0, "18-49": 0, "50+": 0}}
 }'::jsonb,
 1, 1);

-- ================================================
-- 5. CASES
-- ================================================
INSERT INTO cases (
  case_number, case_type, project_id, date_reported, follow_up_date,
  status, location, beneficiary_gender, beneficiary_age, nationality,
  case_worker, services_provided, created_by, updated_by
) VALUES
('GBV-NK-2025-001',
 'sexual_assault',
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 '2025-01-10',
 '2025-02-15',
 'active',
 'Nakivale',
 'female',
 28,
 'Sudanese',
 'Jane Doe',
 ARRAY['Psychosocial Support', 'Medical Care', 'Legal Aid'],
 1, 1),
('GBV-KLA-2025-002',
 'domestic_violence',
 (SELECT id FROM projects WHERE code = 'PRJ-001'),
 '2025-01-12',
 NULL,
 'closed',
 'Kampala',
 'female',
 35,
 'Congolese',
 'John Smith',
 ARRAY['Psychosocial Support', 'Safety Planning'],
 1, 1),
('CP-NK-2025-003',
 'child_abuse',
 (SELECT id FROM projects WHERE code = 'PRJ-002'),
 '2025-01-08',
 '2025-02-10',
 'active',
 'Nakivale',
 'male',
 12,
 'South Sudanese',
 'Sarah Johnson',
 ARRAY['Case Management', 'Family Reunification'],
 1, 1);

-- Update closed date for closed case
UPDATE cases 
SET date_closed = '2025-01-20'
WHERE case_number = 'GBV-KLA-2025-002';

COMMIT;

-- ================================================
-- Summary
-- ================================================
-- Display what was created
SELECT 
  'Thematic Areas' as entity, 
  COUNT(*) as count 
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

