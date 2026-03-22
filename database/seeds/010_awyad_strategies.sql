-- ============================================================
-- SEED: AWYAD Strategy Framework Data
-- Source: D:\Projects\AWYAD\Strategies.rtf
-- Mapped by: GitHub Copilot, March 2026
-- ============================================================
-- Hierarchy: Strategy → Pillar → Core Program Component
--            (+ Interventions & Implementation Approaches as JSONB)
-- ============================================================
-- Run this AFTER all migrations (001 through 009) have been applied.
-- ============================================================

DO $$
DECLARE
    -- Strategy IDs
    prot_id UUID;
    emp_id  UUID;

    -- Protection Pillar IDs
    prot_p1 UUID;
    prot_p2 UUID;
    prot_p3 UUID;
    prot_p4 UUID;

    -- Empowerment Pillar IDs
    emp_p1  UUID;
    emp_p2  UUID;
    emp_p3  UUID;

BEGIN

-- ============================================================
-- STRATEGY 1: AWYAD Protection Strategy 2026-2030
-- ============================================================
INSERT INTO strategies (code, name, description, display_order, is_active)
VALUES (
    'PROT',
    'AWYAD Protection Strategy 2026-2030',
    'Protects communities from rights violations, violence, disease, and environmental harm through structured pillars of intervention.',
    1, TRUE
)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at  = CURRENT_TIMESTAMP
RETURNING id INTO prot_id;

-- ============================================================
-- STRATEGY 2: AWYAD Empowerment Strategy
-- ============================================================
INSERT INTO strategies (code, name, description, display_order, is_active)
VALUES (
    'EMP',
    'AWYAD Empowerment Strategy',
    'Empowers women, youth, and communities through knowledge, resources, and economic opportunities.',
    2, TRUE
)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at  = CURRENT_TIMESTAMP
RETURNING id INTO emp_id;

-- ============================================================
-- PROTECTION PILLARS
-- ============================================================

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (prot_id, 'PROT-P1', 'Pillar 1: Protection of Rights and Promotion of Gender Equality',
    'Promotes gender equality and rights awareness through education, advocacy, and duty-bearer engagement.', 1, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO prot_p1;

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (prot_id, 'PROT-P2', 'Pillar 2: Protection of Lives (from Violence, Abuse and Exploitation)',
    'Prevents and responds to child protection, GBV, and legal protection needs through case management and community structures.', 2, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO prot_p2;

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (prot_id, 'PROT-P3', 'Pillar 3: Protection of Life (from Infections and Diseases)',
    'Addresses SRH, maternal and child health, mental health, and WASH to reduce disease burden.', 3, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO prot_p3;

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (prot_id, 'PROT-P4', 'Pillar 4: Protection of the Environment',
    'Promotes environmental conservation, awareness and restoration activities in communities and schools.', 4, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO prot_p4;

-- ============================================================
-- EMPOWERMENT PILLARS
-- ============================================================

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (emp_id, 'EMP-P1', 'Pillar 1: Knowledge and Skills',
    'Builds education and skills capacity through ECD, basic education, and vocational/digital skilling.', 1, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO emp_p1;

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (emp_id, 'EMP-P2', 'Pillar 2: Access to Resources',
    'Facilitates access to productive, financial, and natural resources for women and youth.', 2, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO emp_p2;

INSERT INTO pillars (strategy_id, code, name, description, display_order, is_active)
VALUES (emp_id, 'EMP-P3', 'Pillar 3: Access to Opportunities',
    'Connects youth and women to business, employment, and digital economic opportunities.', 3, TRUE)
ON CONFLICT (code) DO UPDATE SET strategy_id=EXCLUDED.strategy_id, name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP
RETURNING id INTO emp_p3;

-- ============================================================
-- PROT-P1: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p1, 'PROT-P1-C1',
    'Rights and Gender Equality Awareness and Education',
    'Community and school-based education on rights and gender equality using creative methods and media.',
    1, TRUE,
    '[
        {"order": 1, "name": "Community and school-based rights and gender equality education", "description": "Conduct community and school-based rights and gender equality education sessions for women, youth, and children."},
        {"order": 2, "name": "Creative arts and media for awareness", "description": "Use theatre, radio, social media and creative arts to promote rights and gender equality awareness and behavioural change."},
        {"order": 3, "name": "Training duty bearers", "description": "Facilitate training of duty bearers on gender equality, rights and responsibilities."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "RIGHT-LITE", "description": "Rights Literacy and Transformation Education Approach"}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p1, 'PROT-P1-C2',
    'Rights and Gender Equality Advocacy',
    'Evidence-based advocacy and grassroots coalitions to influence policy and hold duty bearers accountable.',
    2, TRUE,
    '[
        {"order": 1, "name": "Evidence-based advocacy and policy dialogues", "description": "Conduct evidence-based advocacy and policy dialogues and campaigns on rights and gender equality with government and duty bearers."},
        {"order": 2, "name": "Strengthen advocacy groups and coalitions", "description": "Strengthen women, youth and child advocacy groups and coalitions to amplify local voices on gender equality, women rights, child rights and youth rights."},
        {"order": 3, "name": "Media engagement", "description": "Engage media to highlight rights violations and promote accountability."},
        {"order": 4, "name": "Business and human rights engagement", "description": "Engage businesses and manufacturers on human rights and ethics in business, agro-production and manufacturing."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Citizen Voice and Accountability Approach", "description": "Structured approach to citizen-led accountability for rights and gender equality outcomes."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

-- ============================================================
-- PROT-P2: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p2, 'PROT-P2-C1',
    'Child Protection',
    'Comprehensive child protection through awareness, psychosocial support, case management, and family reunification.',
    1, TRUE,
    '[
        {"order": 1, "name": "Child protection awareness sessions", "description": "Conduct child protection awareness sessions for parents/community members, teachers, and children."},
        {"order": 2, "name": "Psychosocial wellbeing activities", "description": "Engage children in psychosocial wellbeing activities e.g TEAMUP, Journey of Life, etc."},
        {"order": 3, "name": "Train community structures and service providers", "description": "Train community structures and service providers on child protection."},
        {"order": 4, "name": "Case management", "description": "Identify, assess, and manage child protection cases including making referrals for other support services."},
        {"order": 5, "name": "Family tracing and alternative care", "description": "Support family tracing, reunification, and alternative care for separated children."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Tulinde Watato Approach", "description": "Community-based child protection methodology."},
        {"order": 2, "name": "Survivor Centred Approach", "description": "Centering the needs, rights and wishes of the survivor in all interventions."},
        {"order": 3, "name": "Team Up Approach", "description": "Structured psychosocial support approach for children."},
        {"order": 4, "name": "CFSs (Child Friendly Spaces)", "description": "Safe structured spaces for children to access services and psychosocial activities."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p2, 'PROT-P2-C2',
    'GBV Prevention and Response',
    'Prevention campaigns, community safe spaces, and survivor-centred case management for GBV.',
    2, TRUE,
    '[
        {"order": 1, "name": "GBV prevention campaigns", "description": "Conduct GBV prevention campaigns targeting men, boys, women, and girls."},
        {"order": 2, "name": "Safe spaces and empowerment clubs", "description": "Establish and strengthen women''s and men''s fora, safe spaces, and empowerment clubs to promote discussions against GBV."},
        {"order": 3, "name": "Train community structures on GBV", "description": "Train community structures and service providers on GBV prevention and response."},
        {"order": 4, "name": "GBV case management", "description": "Identify, assess and manage GBV cases including provision of immediate assistance, psychosocial support, and referrals to other support services."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "WAWEZA Approach", "description": "Women empowerment and GBV response methodology."},
        {"order": 2, "name": "HeForShe Approach", "description": "Engaging men and boys as allies in gender equality."},
        {"order": 3, "name": "Women Own Fora Approach", "description": "Women-led spaces for advocacy and peer support."},
        {"order": 4, "name": "Survivor Centred Approach", "description": "Centering the needs, rights and wishes of the survivor."},
        {"order": 5, "name": "WGSS Approach", "description": "Women and Girls Safe Spaces methodology."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p2, 'PROT-P2-C3',
    'Legal Protection',
    'Legal aid, awareness, mobile clinics, and paralegal support to enable access to justice for survivors.',
    3, TRUE,
    '[
        {"order": 1, "name": "Legal aid, counselling, and court representation", "description": "Provide legal aid, counselling, and court representation for survivors of abuse and rights violations."},
        {"order": 2, "name": "Legal awareness sessions", "description": "Conduct legal awareness sessions on rights, laws, and available services."},
        {"order": 3, "name": "Mobile legal clinics", "description": "Support mobile legal clinics and community legal outreach sessions."},
        {"order": 4, "name": "Train paralegals and community volunteers", "description": "Train paralegals and community volunteers to support access to justice."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Mobile Legal Services Approach", "description": "Outreach-based legal service delivery in hard-to-reach communities."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p2, 'PROT-P2-C4',
    'Community Based Protection',
    'Community protection networks, participatory risk mapping, and social cohesion dialogues.',
    4, TRUE,
    '[
        {"order": 1, "name": "Establish community protection structures", "description": "Establish and strengthen community protection structures and networks to promote safety and wellbeing."},
        {"order": 2, "name": "Community protection assessments", "description": "Conduct community protection assessments and participatory risk mapping."},
        {"order": 3, "name": "Community dialogues on peaceful coexistence", "description": "Facilitate community dialogues promoting peaceful coexistence and social cohesion."},
        {"order": 4, "name": "Community socialization and recreation", "description": "Promote community socialization and recreation events."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Community Based Protection Approach", "description": "Structured community-led protection framework engaging local structures."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p2, 'PROT-P2-C5',
    'Social Protection',
    'In-kind/cash assistance and social inclusion support for marginalized and at-risk individuals.',
    5, TRUE,
    '[
        {"order": 1, "name": "Social Assistance", "description": "Provide in-kind or cash support to at-risk individuals or households to meet basic needs and build resilience."},
        {"order": 2, "name": "Social Inclusion", "description": "Identify and support marginalized groups to access basic services and participate in government programs and public spaces."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Community Conversations Approach", "description": "Facilitated community dialogues to address norms and promote inclusion."},
        {"order": 2, "name": "Play and MDD Events", "description": "Mass community mobilization through play and multi-annual development days."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

-- ============================================================
-- PROT-P3: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p3, 'PROT-P3-C1',
    'Sexual and Reproductive Health',
    'SRHR education, peer-led services, outreach, menstrual health, and social accountability mechanisms.',
    1, TRUE,
    '[
        {"order": 1, "name": "SRHR education and awareness", "description": "Conduct community, school, and digital SRHR education and awareness sessions."},
        {"order": 2, "name": "Youth-friendly SRHR structures", "description": "Establish and strengthen peer-led and youth-friendly SRHR structures and services."},
        {"order": 3, "name": "Outreach and mobile SRHR delivery", "description": "Facilitate outreach and mobile SRHR service delivery."},
        {"order": 4, "name": "Menstrual health management", "description": "Promote menstrual health management and access to hygiene materials."},
        {"order": 5, "name": "SRHR advocacy and accountability", "description": "Strengthen advocacy and social accountability for SRHR."}
    ]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p3, 'PROT-P3-C2',
    'Maternal and Child Health and Nutrition (MCHN)',
    'Integrated maternal, child health and nutrition services through community and digital channels.',
    2, TRUE,
    '[
        {"order": 1, "name": "Health education on safe motherhood", "description": "Conduct community and digital health education on safe motherhood, child health, and nutrition."},
        {"order": 2, "name": "Strengthen MCH service access", "description": "Strengthen access to maternal and child health services."},
        {"order": 3, "name": "Nutrition promotion", "description": "Promote maternal and child nutrition through education, cooking demonstrations, and growth monitoring."},
        {"order": 4, "name": "Male engagement in MCH", "description": "Support male engagement and community participation in MCH."},
        {"order": 5, "name": "Strengthen community health systems", "description": "Strengthen community health systems through training and service support."},
        {"order": 6, "name": "MCH advocacy", "description": "Engage in advocacy for improved maternal, newborn, and child health services and accountability."}
    ]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p3, 'PROT-P3-C3',
    'Mental Health and Psychosocial Support (MHPSS)',
    'Community mental health awareness, peer support, individual/group counselling, and referral pathways.',
    3, TRUE,
    '[
        {"order": 1, "name": "Mental health awareness and wellbeing sessions", "description": "Conduct community, school, and digital mental health awareness and wellbeing promotion sessions."},
        {"order": 2, "name": "Peer and women support groups", "description": "Establish and strengthen peer, youth, and women support groups for psychosocial wellbeing."},
        {"order": 3, "name": "Safe community spaces", "description": "Create safe and inclusive community spaces for social interaction and healing."},
        {"order": 4, "name": "PFA and counselling", "description": "Provide psychosocial first aid (PFA), individual and group counselling for affected persons."},
        {"order": 5, "name": "Referral pathways to specialized MHPSS", "description": "Strengthen referral pathways and access to specialized MHPSS services."},
        {"order": 6, "name": "Frontline worker capacity building", "description": "Build capacity of frontline workers and systems to deliver MHPSS."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Team Up Approach", "description": "Structured psychosocial support programme."},
        {"order": 2, "name": "EASE Approach", "description": "Emotional and psychosocial support methodology."},
        {"order": 3, "name": "Be There / Reach Now", "description": "Peer-based mental health support approach."},
        {"order": 4, "name": "Stronger Together", "description": "Group-based psychosocial recovery approach."},
        {"order": 5, "name": "CORE", "description": "Community-based psychosocial support framework."},
        {"order": 6, "name": "IPTG / PM Plus / CAT", "description": "Structured psychological therapy approaches for common mental disorders."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p3, 'PROT-P3-C4',
    'WASH in Schools and Communities',
    'Hygiene education, community WASH structures, inclusive facilities, and accountability for quality services.',
    4, TRUE,
    '[
        {"order": 1, "name": "Hygiene education campaigns", "description": "Conduct school and community hygiene education and awareness campaigns."},
        {"order": 2, "name": "WASH clubs and community hygiene structures", "description": "Establish and strengthen WASH clubs and community hygiene structures."},
        {"order": 3, "name": "Improve access to inclusive WASH facilities", "description": "Improve access to safe and inclusive WASH facilities."},
        {"order": 4, "name": "Community accountability for WASH", "description": "Strengthen community accountability and advocacy for quality WASH services."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "CHAST", "description": "Child Hygiene And Sanitation Training approach."},
        {"order": 2, "name": "PHAST", "description": "Participatory Hygiene and Sanitation Transformation approach."},
        {"order": 3, "name": "CLTS", "description": "Community Led Total Sanitation approach."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

-- ============================================================
-- PROT-P4: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p4, 'PROT-P4-C1',
    'Environmental Awareness and Advocacy',
    'Campaigns, clubs, and policy advocacy linking environment to livelihoods and community rights.',
    1, TRUE,
    '[
        {"order": 1, "name": "Environmental awareness campaigns", "description": "Awareness campaigns on environmental rights and duties."},
        {"order": 2, "name": "Environmental clubs", "description": "Environmental clubs in schools and youth groups."},
        {"order": 3, "name": "Environmental law advocacy", "description": "Advocacy for enforcement of environmental laws and climate policies."},
        {"order": 4, "name": "Community dialogues on environment", "description": "Community dialogues linking environment and protection of livelihoods."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Env-Alert Approach", "description": "Environmental monitoring and community alerting approach."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    prot_p4, 'PROT-P4-C2',
    'Environmental Conservation and Restoration',
    'Tree planting, soil/water conservation, protection of endangered species, and recycling campaigns.',
    2, TRUE,
    '[
        {"order": 1, "name": "Tree planting campaigns", "description": "Conduct tree planting campaigns in communities and schools."},
        {"order": 2, "name": "Soil and water conservation", "description": "Promote soil and water conservation to protect the environment."},
        {"order": 3, "name": "Protect endangered species and wetlands", "description": "Promote protection of endangered tree species, wetlands, and watersheds."},
        {"order": 4, "name": "Recycling campaigns", "description": "Conduct recycling campaigns to minimize waste and protect the environment."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Env-Protect Approach", "description": "Structured environmental conservation and restoration methodology."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

-- ============================================================
-- EMP-P1: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p1, 'EMP-P1-C1',
    'Early Childhood Education',
    'Community-based ECD centres with play-based learning, trained caregivers, and parent engagement.',
    1, TRUE,
    '[
        {"order": 1, "name": "Establish and support ECD centres", "description": "Establish and support community-based ECD centres with age-appropriate learning and play materials, equipment, and instructional materials."},
        {"order": 2, "name": "Train caregivers and teachers", "description": "Train caregivers and teachers in play-based, inclusive, and child-centred pedagogy."},
        {"order": 3, "name": "Parent and community engagement", "description": "Engage parents and communities in early learning and positive parenting sessions."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Play to Learn Circles / Play-Based Learning Approach", "description": "Structured play-based early childhood learning methodology."},
        {"order": 2, "name": "Project Based Learning Approach", "description": "Hands-on inquiry-driven learning for early childhood."},
        {"order": 3, "name": "CHAST Approach", "description": "Child hygiene and sanitation integration in ECD settings."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p1, 'EMP-P1-C2',
    'Basic Education (Primary and Secondary)',
    'Support for vulnerable children through materials, inclusive pedagogy, safe learning environments, and scholarships.',
    2, TRUE,
    '[
        {"order": 1, "name": "Scholastic materials and bursaries", "description": "Provide scholastic materials, assistive devices, bursaries, and sanitary (MHM) kits to vulnerable children to reduce drop-outs."},
        {"order": 2, "name": "Train teachers in inclusive pedagogy", "description": "Train teachers in inclusive, gender-responsive, and psychosocial-sensitive teaching."},
        {"order": 3, "name": "Improve learning environments", "description": "Promote improved learning environments through supporting schools to put in place WASH, safety, and accessibility measures."},
        {"order": 4, "name": "Innovative learning for quality", "description": "Promotion of innovative learning for improved quality of learning."},
        {"order": 5, "name": "Back-to-school campaigns", "description": "Conduct back-to-school and community sensitization campaigns on the value of education."},
        {"order": 6, "name": "Empowerment clubs and school protection committees", "description": "Establish and support Girls and Boys Empowerment Clubs and school protection committees."},
        {"order": 7, "name": "Scholarships for vulnerable girls", "description": "Provide scholarships for vulnerable girls, especially survivors of VAEN."},
        {"order": 8, "name": "School management and governance", "description": "Strengthen school management and governance systems, policies and practices."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "IASC / Cannot Wait to Learn", "description": "Digital learning approach for education in emergencies."},
        {"order": 2, "name": "Safe Schools Approach", "description": "Comprehensive school safety framework."},
        {"order": 3, "name": "4S (Strong Schools, Strong Systems) Approach", "description": "Systems-strengthening framework for education quality."},
        {"order": 4, "name": "TAL Approach", "description": "Teaching at the Right Level methodology."},
        {"order": 5, "name": "PLE (Pathways to Learning and Empowerment) Approach", "description": "Integrated learning and empowerment pathway for vulnerable children."},
        {"order": 6, "name": "SEL Approach", "description": "Social and Emotional Learning methodology."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p1, 'EMP-P1-C3',
    'Youth and Women Skilling',
    'Vocational, soft-skills, and digital training linked to market demand and certification pathways.',
    3, TRUE,
    '[
        {"order": 1, "name": "Vocational training in market-demanded trades", "description": "Provide hands-on training in market-demanded trades in renewable energy, mining, petroleum, agro-processing, tourism, ICT, motor-mechanics, construction and performing arts."},
        {"order": 2, "name": "Internships and apprenticeships", "description": "Facilitate internships, apprenticeships, and industrial attachments in private companies and vocational centres for youth skilling and engage DIT for certification."},
        {"order": 3, "name": "Soft skills training", "description": "Deliver soft skills training in communication, teamwork, leadership, critical thinking, problem-solving, and work ethics."},
        {"order": 4, "name": "Life skills and SRHR integration", "description": "Integrate life skills, SRHR awareness, and psychosocial wellbeing modules into all skilling programs."},
        {"order": 5, "name": "ICT and digital literacy", "description": "Offer basic to advanced ICT and digital literacy training."},
        {"order": 6, "name": "Digital-based working and content creation", "description": "Provide training on digital-based working and content creation."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Youth Ignite Approach", "description": "High-energy youth skilling and entrepreneurship activation methodology."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

-- ============================================================
-- EMP-P2: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p2, 'EMP-P2-C1',
    'Access to Productive Resources',
    'Agro-inputs, value addition technologies, producer groups, and environmentally friendly tools for women and youth.',
    1, TRUE,
    '[
        {"order": 1, "name": "Agro-practices and inputs support", "description": "Support women and youth to acquire improved agro-practices, agricultural inputs, tools, and equipment for production and value addition."},
        {"order": 2, "name": "Value addition technologies", "description": "Support youth and women acquire value addition technologies to participate in value addition."},
        {"order": 3, "name": "Producer groups and cooperatives", "description": "Strengthen producer groups and cooperatives for collective access to inputs and markets."},
        {"order": 4, "name": "Environmentally friendly technologies", "description": "Facilitate access to environmentally friendly technologies (solar, irrigation kits, clean cooking, etc)."}
    ]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p2, 'EMP-P2-C2',
    'Access to Financial Resources',
    'VSLAs, financial literacy, digital financial services, grants, and microfinance linkages for women and youth.',
    2, TRUE,
    '[
        {"order": 1, "name": "VSLAs and youth savings groups", "description": "Establish and strengthen Village Savings and Loan Associations (VSLAs) and youth savings groups."},
        {"order": 2, "name": "Financial literacy and entrepreneurship training", "description": "Conduct financial literacy and entrepreneurship training focusing on saving, budgeting, and investment."},
        {"order": 3, "name": "Digital financial services", "description": "Promote access to digital financial services and mobile banking solutions."},
        {"order": 4, "name": "Start-up grants and revolving funds", "description": "Facilitate start-up grants, revolving funds, and microcredit for youth and women enterprises."},
        {"order": 5, "name": "Microfinance and SACCO partnerships", "description": "Partner with microfinance institutions, SACCOs, and commercial banks to increase youth and women access to affordable credit."},
        {"order": 6, "name": "Government funding programs", "description": "Support women and youth groups to participate and access funds from government funding programs."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "VSLA Plus Approach", "description": "Enhanced Village Savings and Loan Association methodology with market and enterprise linkages."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p2, 'EMP-P2-C3',
    'Access to Natural and Environmental Resources',
    'Artisanal mining, mineral value addition, and green jobs from natural resources for youth and women.',
    3, TRUE,
    '[
        {"order": 1, "name": "Artisanal and small-scale mining (ASM)", "description": "Support youth and women engage in artisanal and small-scale mining with formal registration, safety training, and access to equipment."},
        {"order": 2, "name": "Jewelry and mineral value addition", "description": "Support youth engage in jewelry design, stone cutting, and mineral value addition enterprises."},
        {"order": 3, "name": "Inclusive green jobs", "description": "Support youth and women use available natural resources to start inclusive green jobs."}
    ]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

-- ============================================================
-- EMP-P3: COMPONENTS
-- ============================================================

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p3, 'EMP-P3-C1',
    'Business Opportunities',
    'Business registration, private sector linkages, incubation hubs, expos, and local market structures.',
    1, TRUE,
    '[
        {"order": 1, "name": "Business registration and formalization", "description": "Support youth and women register and formalize businesses and certify their products with regulatory authorities."},
        {"order": 2, "name": "Auxiliary services for private companies", "description": "Engage with private and business companies to enable youth and women provide auxiliary services such as catering, transport, equipment maintenance, or protective gear supply."},
        {"order": 3, "name": "Business incubation hubs", "description": "Establish business incubation hubs to provide opportunities to nurture businesses."},
        {"order": 4, "name": "Business expos and market linkages", "description": "Organize business expos to connect youth and women to markets, investors, skills, and partnerships for economic empowerment."},
        {"order": 5, "name": "Local market structures for agribusiness", "description": "Establish local market structures to enable youth and women start agro-businesses."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Busy-Opps Approach", "description": "Business opportunity identification and development methodology."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p3, 'EMP-P3-C2',
    'Employment Opportunities',
    'Employer training, on-the-job pathways, corporate internships, and international labour export linkages.',
    2, TRUE,
    '[
        {"order": 1, "name": "Employer training on decent work standards", "description": "Train employers and labour export companies on decent work standards and work/human rights."},
        {"order": 2, "name": "On-the-job training-to-employment pathways", "description": "Partner with local enterprises for on-the-job training-to-employment pathways."},
        {"order": 3, "name": "Corporate internships and volunteerships", "description": "Partner with corporate companies and support youth internships, apprenticeships and volunteerships to employment pathways."},
        {"order": 4, "name": "Labour export linkages", "description": "In partnership with accredited labour export companies, identify and link youth for employment."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "Emp-Link Approach", "description": "Employment linkage methodology connecting youth to formal employment pathways."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

INSERT INTO core_program_components (pillar_id, code, name, description, display_order, is_active, interventions, implementation_approaches)
VALUES (
    emp_p3, 'EMP-P3-C3',
    'Digital Opportunities',
    'Digital hubs, e-commerce training, remote work platforms, and online marketplace linkages for youth.',
    3, TRUE,
    '[
        {"order": 1, "name": "Digital Hubs and Learning Labs", "description": "Establish Digital Hubs and Learning Labs for online work, freelancing, and content creation."},
        {"order": 2, "name": "E-commerce and digital marketing training", "description": "Train and mentor youth in e-commerce, digital marketing, and branding for small businesses."},
        {"order": 3, "name": "Remote work platforms", "description": "Facilitate youth participation in remote work platforms such as Upwork, Fiverr, and Toptal."},
        {"order": 4, "name": "Digital shops and online marketplaces", "description": "Encourage creation of digital shops and online marketplaces for local products and link youth enterprises to online buyers and digital marketplaces."}
    ]'::jsonb,
    '[
        {"order": 1, "name": "DWP (Digital Work Place) Approach", "description": "Structured digital workplace and remote work readiness methodology."}
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET pillar_id=EXCLUDED.pillar_id, name=EXCLUDED.name, interventions=EXCLUDED.interventions, implementation_approaches=EXCLUDED.implementation_approaches, updated_at=CURRENT_TIMESTAMP;

RAISE NOTICE 'AWYAD Strategy Framework seed complete.';
RAISE NOTICE '  - 2 strategies inserted/updated';
RAISE NOTICE '  - 7 pillars inserted/updated (4 Protection + 3 Empowerment)';
RAISE NOTICE '  - 22 core program components inserted/updated (13 Protection + 9 Empowerment)';

END $$;
