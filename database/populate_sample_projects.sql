-- Create sample projects linked to core program components
-- This will populate the Strategic Dashboard with meaningful data

DO $$
DECLARE
    -- Component IDs
    comp_rights_ed UUID;
    comp_child_prot UUID;
    comp_gbv UUID;
    comp_livelihood UUID;
    comp_education UUID;
    
    -- Project IDs
    proj1_id UUID;
    proj2_id UUID;
    proj3_id UUID;
    proj4_id UUID;
    proj5_id UUID;
    
BEGIN
    -- Get some component IDs
    SELECT id INTO comp_rights_ed FROM core_program_components WHERE code = 'P1-C1' LIMIT 1;
    SELECT id INTO comp_child_prot FROM core_program_components WHERE code = 'P2-C1' LIMIT 1;
    SELECT id INTO comp_gbv FROM core_program_components WHERE code = 'P2-C2' LIMIT 1;
    SELECT id INTO comp_livelihood FROM core_program_components WHERE code = 'P3-C1' LIMIT 1;
    SELECT id INTO comp_education FROM core_program_components WHERE code = 'E1-C1' LIMIT 1;
    
    -- Create sample projects
    INSERT INTO projects (name, description, donor, status, start_date, end_date, budget, expenditure, core_program_component_id, result_area)
    VALUES 
    ('Community Rights Education - Nakivale', 'Rights and gender equality education in Nakivale settlement', 'UNHCR', 'Active', '2024-01-01', '2026-12-31', 150000, 75000, comp_rights_ed, 'RESULT 1')
    RETURNING id INTO proj1_id;
    
    INSERT INTO projects (name, description, donor, status, start_date, end_date, budget, expenditure, core_program_component_id, result_area)
    VALUES 
    ('Child Protection Services - Kampala', 'Comprehensive child protection and case management in Kampala', 'UNICEF', 'Active', '2024-06-01', '2026-12-31', 200000, 50000, comp_child_prot, 'RESULT 2')
    RETURNING id INTO proj2_id;
    
    INSERT INTO projects (name, description, donor, status, start_date, end_date, budget, expenditure, core_program_component_id, result_area)
    VALUES 
    ('GBV Prevention and Response - Kyangwali', 'Gender-based violence prevention and survivor support', 'UN Women', 'Active', '2024-03-01', '2026-06-30', 180000, 90000, comp_gbv, 'RESULT 2')
    RETURNING id INTO proj3_id;
    
    INSERT INTO projects (name, description, donor, status, start_date, end_date, budget, expenditure, core_program_component_id, result_area)
    VALUES 
    ('Livelihood Support - Adjumani', 'Economic strengthening and livelihood support for refugees', 'WFP', 'Active', '2024-01-01', '2025-12-31', 250000, 180000, comp_livelihood, 'RESULT 3')
    RETURNING id INTO proj4_id;
    
    INSERT INTO projects (name, description, donor, status, start_date, end_date, budget, expenditure, core_program_component_id, result_area)
    VALUES 
    ('Accelerated Education - Bidibidi', 'Accelerated education program for out-of-school youth', 'USAID', 'Active', '2024-01-01', '2026-12-31', 175000, 60000, comp_education, 'RESULT 4')
    RETURNING id INTO proj5_id;
    
    -- Create sample indicators for these projects
    INSERT INTO indicators (code, name, description, type, project_id, annual_target, achieved, lop_target, baseline, indicator_scope, result_area, data_type)
    VALUES 
    ('IND-001', 'Number of people trained on rights and gender equality', 'People who completed rights education sessions', 'Output', proj1_id, 500, 250, 1500, 0, 'project', 'RESULT 1', 'number'),
    ('IND-002', 'Number of child protection cases managed', 'Children receiving case management services', 'Output', proj2_id, 150, 80, 450, 0, 'project', 'RESULT 2', 'number'),
    ('IND-003', 'Number of GBV survivors receiving support', 'GBV survivors accessing survivor-centered services', 'Output', proj3_id, 200, 120, 600, 0, 'project', 'RESULT 2', 'number'),
    ('IND-004', 'Number of households receiving livelihood support', 'Households supported with income generating activities', 'Output', proj4_id, 300, 220, 900, 0, 'project', 'RESULT 3', 'number'),
    ('IND-005', 'Number of youth enrolled in accelerated education', 'Out-of-school youth enrolled in AEP', 'Output', proj5_id, 400, 180, 1200, 0, 'project', 'RESULT 4', 'number');
    
    -- Create sample activities for these projects
    INSERT INTO activities (activity_name, project_id, planned_date, status, location)
    VALUES 
    ('Rights education session - Village A', proj1_id, '2025-02-01', 'Completed', 'Village A'),
    ('Rights education session - Village B', proj1_id, '2025-02-15', 'Completed', 'Village B'),
    ('Child protection training - Community workers', proj2_id, '2025-01-20', 'Completed', 'Community Center'),
    ('GBV awareness campaign', proj3_id, '2025-01-15', 'Completed', 'District Hub'),
    ('VSLA group formation', proj4_id, '2025-01-10', 'Completed', 'Village C'),
    ('AEP enrollment drive', proj5_id, '2025-02-01', 'Planned', 'School Compound');
    
    -- Create sample cases
    INSERT INTO cases (case_number, project_id, date_reported, status, age_group, gender, severity, location)
    VALUES 
    ('CP-2025-001', proj2_id, '2025-01-15', 'Open', '10-14', 'Female', 'High', 'Community A'),
    ('CP-2025-002', proj2_id, '2025-01-20', 'In Progress', '10-14', 'Male', 'Medium', 'Community B'),
    ('GBV-2025-001', proj3_id, '2025-01-18', 'In Progress', '25-34', 'Female', 'High', 'District Hub'),
    ('GBV-2025-002', proj3_id, '2025-01-25', 'Open', '18-24', 'Female', 'High', 'Village D');
    
    RAISE NOTICE 'Sample projects, indicators, activities, and cases created successfully';
    
END $$;

-- Show summary
SELECT 
    'Projects' as entity, 
    COUNT(*) as count 
FROM projects
UNION ALL
SELECT 
    'Indicators', 
    COUNT(*) 
FROM indicators
UNION ALL
SELECT 
    'Activities', 
    COUNT(*) 
FROM activities
UNION ALL
SELECT 
    'Cases', 
    COUNT(*) 
FROM cases;
