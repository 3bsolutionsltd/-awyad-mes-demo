-- Populate Strategic Framework Data for AWYAD MES
-- Based on AWYAD Protection and Empowerment Strategies 2026-2030

-- ====================================
-- STRATEGIES
-- ====================================

INSERT INTO strategies (code, name, description, display_order, is_active) VALUES
('PROT-2026', 'AWYAD Protection Strategy', 'Comprehensive protection framework focusing on rights, lives, and livelihoods of vulnerable populations (2026-2030)', 1, true),
('EMPOWER-2026', 'AWYAD Empowerment Strategy', 'Holistic empowerment approach building knowledge, resources, and opportunities for sustainable development (2026-2030)', 2, true);

-- Get strategy IDs for later use
DO $$
DECLARE
    prot_strategy_id UUID;
    empower_strategy_id UUID;
    
    -- Pillar IDs
    pillar_rights_id UUID;
    pillar_lives_id UUID;
    pillar_livelihoods_id UUID;
    pillar_mental_health_id UUID;
    pillar_knowledge_id UUID;
    pillar_resources_id UUID;
    pillar_opportunities_id UUID;
    
BEGIN
    -- Get Strategy IDs
    SELECT id INTO prot_strategy_id FROM strategies WHERE code = 'PROT-2026';
    SELECT id INTO empower_strategy_id FROM strategies WHERE code = 'EMPOWER-2026';
    
    -- ====================================
    -- PROTECTION STRATEGY PILLARS
    -- ====================================
    
    -- Pillar 1: Protection of Rights and Promotion of Gender Equality
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('P1-RIGHTS', 'Protection of Rights and Promotion of Gender Equality', 
            'Ensuring fundamental rights are protected and gender equality is promoted across all intervention areas',
            prot_strategy_id, 1, true)
    RETURNING id INTO pillar_rights_id;
    
    -- Pillar 2: Protection of Lives (from violence, abuse and exploitation)
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('P2-LIVES', 'Protection of Lives', 
            'Protection from violence, abuse and exploitation through comprehensive safety measures',
            prot_strategy_id, 2, true)
    RETURNING id INTO pillar_lives_id;
    
    -- Pillar 3: Protection of Livelihoods
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('P3-LIVELIHOODS', 'Protection of Livelihoods', 
            'Ensuring sustainable livelihoods and economic security for vulnerable populations',
            prot_strategy_id, 3, true)
    RETURNING id INTO pillar_livelihoods_id;
    
    -- Pillar 4: Mental Health and Psychosocial Support
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('P4-MHPSS', 'Mental Health and Psychosocial Support', 
            'Comprehensive mental health and psychosocial support services',
            prot_strategy_id, 4, true)
    RETURNING id INTO pillar_mental_health_id;
    
    -- ====================================
    -- PROTECTION PILLAR 1: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, interventions, display_order, is_active)
    VALUES 
    ('P1-C1', 'Rights and Gender Equality Awareness and Education', 
     'Community and school-based education on rights and gender equality',
     pillar_rights_id,
     '["Community-based rights education sessions", "School-based rights education programs", "Gender equality awareness campaigns", "Creative arts and media for behavioral change", "Duty bearer training on rights and responsibilities"]'::jsonb,
     1, true),
     
    ('P1-C2', 'Rights and Gender Equality Advocacy', 
     'Evidence-based advocacy for rights protection and gender equality',
     pillar_rights_id,
     '["Policy dialogues with government", "Evidence-based advocacy campaigns", "Strengthening advocacy groups and coalitions", "Media engagement on rights violations", "Business ethics and human rights"]'::jsonb,
     2, true);
    
    -- ====================================
    -- PROTECTION PILLAR 2: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, intervention_areas, display_order, is_active)
    VALUES 
    ('P2-C1', 'Child Protection', 
     'Comprehensive child protection services and case management',
     pillar_lives_id,
     ARRAY['Child protection awareness sessions', 'Psychosocial wellbeing activities (TEAMUP, Journey of Life)', 'Training community structures and service providers', 'Child protection case management', 'Family tracing and reunification', 'Alternative care for separated children'],
     1, true),
     
    ('P2-C2', 'Gender-Based Violence Prevention and Response', 
     'Prevention and response to all forms of gender-based violence',
     pillar_lives_id,
     ARRAY['GBV awareness and prevention campaigns', 'Survivor-centered case management', 'Safe spaces and support services', 'Engaging men and boys in prevention', 'Community-based GBV response mechanisms'],
     2, true),
     
    ('P2-C3', 'Women Protection and Empowerment', 
     'Protection and empowerment services for women and adolescent girls',
     pillar_lives_id,
     ARRAY['Women protection awareness sessions', 'Safe spaces for women and girls', 'Economic empowerment linked to protection', 'Leadership and decision-making support', 'Reproductive health rights education'],
     3, true),
     
    ('P2-C4', 'Youth Protection and Positive Development', 
     'Protection services and positive development opportunities for youth',
     pillar_lives_id,
     ARRAY['Youth protection awareness sessions', 'Youth-friendly safe spaces', 'Life skills and positive development programs', 'Youth leadership and civic engagement', 'Prevention of harmful practices'],
     4, true);
    
    -- ====================================
    -- PROTECTION PILLAR 3: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, intervention_areas, display_order, is_active)
    VALUES 
    ('P3-C1', 'Livelihood Support and Economic Strengthening', 
     'Economic strengthening and livelihood support for vulnerable households',
     pillar_livelihoods_id,
     ARRAY['Cash and voucher assistance', 'Income generating activities support', 'Financial literacy training', 'Savings and lending groups (VSLA)', 'Market linkages and value chain development'],
     1, true),
     
    ('P3-C2', 'Food Security and Nutrition', 
     'Ensuring food security and improved nutrition for vulnerable populations',
     pillar_livelihoods_id,
     ARRAY['Food assistance programs', 'Nutrition education and counseling', 'Kitchen gardening and small-scale farming', 'Infant and young child feeding support', 'Emergency food response'],
     2, true);
    
    -- ====================================
    -- PROTECTION PILLAR 4: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, intervention_areas, display_order, is_active)
    VALUES 
    ('P4-C1', 'Mental Health Services', 
     'Clinical and community-based mental health services',
     pillar_mental_health_id,
     ARRAY['Mental health assessment and counseling', 'Referral to specialized services', 'Community mental health awareness', 'Psychotropic medication support where needed', 'Mental health first aid training'],
     1, true),
     
    ('P4-C2', 'Psychosocial Support Programs', 
     'Group and community-based psychosocial support activities',
     pillar_mental_health_id,
     ARRAY['Psychosocial support groups', 'Art and play therapy', 'Sport and recreation activities', 'Community healing and reconciliation', 'Peer support programs'],
     2, true);
    
    -- ====================================
    -- EMPOWERMENT STRATEGY PILLARS
    -- ====================================
    
    -- Pillar 1: Knowledge and Skills
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('E1-KNOWLEDGE', 'Knowledge and Skills', 
            'Building knowledge and skills for personal and professional development',
            empower_strategy_id, 1, true)
    RETURNING id INTO pillar_knowledge_id;
    
    -- Pillar 2: Access to Resources
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('E2-RESOURCES', 'Access to Resources', 
            'Ensuring access to productive resources and essential services',
            empower_strategy_id, 2, true)
    RETURNING id INTO pillar_resources_id;
    
    -- Pillar 3: Access to Opportunities
    INSERT INTO pillars (code, name, description, strategy_id, display_order, is_active)
    VALUES ('E3-OPPORTUNITIES', 'Access to Opportunities', 
            'Creating and facilitating access to development opportunities',
            empower_strategy_id, 3, true)
    RETURNING id INTO pillar_opportunities_id;
    
    -- ====================================
    -- EMPOWERMENT PILLAR 1: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, intervention_areas, display_order, is_active)
    VALUES 
    ('E1-C1', 'Education and Literacy', 
     'Formal and non-formal education and literacy programs',
     pillar_knowledge_id,
     ARRAY['Accelerated education programs', 'Adult literacy classes', 'Early childhood education', 'Secondary education support', 'Girls education programming'],
     1, true),
     
    ('E1-C2', 'Skills Training and Vocational Education', 
     'Technical and vocational skills training for employment',
     pillar_knowledge_id,
     ARRAY['Vocational skills training', 'Apprenticeship programs', 'Entrepreneurship training', 'Digital literacy and ICT skills', 'Life skills education'],
     2, true),
     
    ('E1-C3', 'Leadership and Civic Engagement', 
     'Building leadership capacity and promoting civic participation',
     pillar_knowledge_id,
     ARRAY['Leadership training for women and youth', 'Civic education programs', 'Community governance support', 'Youth councils and platforms', 'Advocacy and campaigning skills'],
     3, true);
    
    -- ====================================
    -- EMPOWERMENT PILLAR 2: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, intervention_areas, display_order, is_active)
    VALUES 
    ('E2-C1', 'Access to Productive Resources', 
     'Facilitating access to land, credit, and productive assets',
     pillar_resources_id,
     ARRAY['Agricultural inputs and tools', 'Micro-credit and loans', 'Asset transfers', 'Land rights support', 'Technology and equipment access'],
     1, true),
     
    ('E2-C2', 'Access to Basic Services', 
     'Improving access to essential health, education, and social services',
     pillar_resources_id,
     ARRAY['Health service linkages', 'Education fee support', 'WASH facilities and services', 'Legal aid and documentation', 'Social protection linkages'],
     2, true),
     
    ('E2-C3', 'Access to Information', 
     'Ensuring access to relevant information and knowledge',
     pillar_resources_id,
     ARRAY['Information and communication platforms', 'Market information systems', 'Rights and services information', 'Digital information access', 'Community knowledge sharing'],
     3, true);
    
    -- ====================================
    -- EMPOWERMENT PILLAR 3: CORE PROGRAM COMPONENTS
    -- ====================================
    
    INSERT INTO core_program_components (code, name, description, pillar_id, intervention_areas, display_order, is_active)
    VALUES 
    ('E3-C1', 'Business and Employment Opportunities', 
     'Creating and linking to business and employment opportunities',
     pillar_opportunities_id,
     ARRAY['Job placement and matching', 'Business incubation support', 'Market linkages and networking', 'Contract farming arrangements', 'Private sector partnerships'],
     1, true),
     
    ('E3-C2', 'Youth Development Opportunities', 
     'Comprehensive youth development and transition support',
     pillar_opportunities_id,
     ARRAY['Youth internships and work experience', 'Mentorship programs', 'Innovation and creativity hubs', 'Sports and arts opportunities', 'Youth exchange programs'],
     2, true),
     
    ('E3-C3', 'Women Economic Empowerment', 
     'Economic empowerment opportunities specifically for women',
     pillar_opportunities_id,
     ARRAY['Women business networks', 'Cooperative and collective enterprises', 'Value addition and processing', 'Cross-border trade support', 'Women leadership in business'],
     3, true);

END $$;

-- Commit the transaction
COMMIT;
