-- ============================================================================
-- Seed Common Case Types and Categories
-- Pre-populates the system with standard protection case classifications
-- ============================================================================

-- Insert Case Types
INSERT INTO case_types (code, name, description, display_order, is_active) VALUES
('GBV', 'Gender-Based Violence', 'Cases related to gender-based violence including sexual, physical, psychological, and economic violence', 1, TRUE),
('CP', 'Child Protection', 'Cases involving children at risk including abuse, neglect, exploitation, and early marriage', 2, TRUE),
('LEGAL', 'Legal Aid', 'Legal assistance cases including civil, criminal, family law, and land disputes', 3, TRUE),
('PSS', 'Psychosocial Support', 'Mental health and psychosocial support including counseling, therapy, and support groups', 4, TRUE),
('ECON', 'Economic Empowerment', 'Economic empowerment activities including VSLA, business training, grants, and employment support', 5, TRUE),
('EDU', 'Education Support', 'Education assistance including school fees, materials, tutoring, and scholarships', 6, TRUE),
('HEALTH', 'Health Services', 'Health-related support including medical referrals, health education, and access to healthcare', 7, TRUE),
('SHELTER', 'Shelter & Accommodation', 'Shelter provision and accommodation support for individuals in need', 8, TRUE),
('OTHER', 'Other Protection Services', 'Other protection-related cases not covered by specific categories', 99, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Get type IDs for categories (using DO block to handle dynamic IDs)
DO $$
DECLARE
    gbv_id UUID;
    cp_id UUID;
    legal_id UUID;
    pss_id UUID;
    econ_id UUID;
    edu_id UUID;
    health_id UUID;
    shelter_id UUID;
BEGIN
    -- Get case type IDs
    SELECT id INTO gbv_id FROM case_types WHERE code = 'GBV';
    SELECT id INTO cp_id FROM case_types WHERE code = 'CP';
    SELECT id INTO legal_id FROM case_types WHERE code = 'LEGAL';
    SELECT id INTO pss_id FROM case_types WHERE code = 'PSS';
    SELECT id INTO econ_id FROM case_types WHERE code = 'ECON';
    SELECT id INTO edu_id FROM case_types WHERE code = 'EDU';
    SELECT id INTO health_id FROM case_types WHERE code = 'HEALTH';
    SELECT id INTO shelter_id FROM case_types WHERE code = 'SHELTER';

    -- Insert GBV Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (gbv_id, 'GBV_SEXUAL', 'Sexual Violence', 'Sexual assault, rape, sexual exploitation, and harassment', 1, TRUE),
    (gbv_id, 'GBV_PHYSICAL', 'Physical Violence', 'Physical assault, battery, and bodily harm', 2, TRUE),
    (gbv_id, 'GBV_PSYCH', 'Psychological Violence', 'Emotional abuse, threats, intimidation, and psychological harm', 3, TRUE),
    (gbv_id, 'GBV_ECON', 'Economic Violence', 'Economic abuse, denial of resources, and financial exploitation', 4, TRUE),
    (gbv_id, 'GBV_OTHER', 'Other GBV', 'Other forms of gender-based violence', 99, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Child Protection Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (cp_id, 'CP_ABUSE', 'Child Abuse', 'Physical, sexual, or emotional abuse of children', 1, TRUE),
    (cp_id, 'CP_NEGLECT', 'Child Neglect', 'Failure to provide adequate care, supervision, or necessities', 2, TRUE),
    (cp_id, 'CP_EXPLOIT', 'Child Exploitation', 'Labor exploitation, trafficking, and other forms of exploitation', 3, TRUE),
    (cp_id, 'CP_MARRIAGE', 'Early/Forced Marriage', 'Child marriage and forced marriage cases', 4, TRUE),
    (cp_id, 'CP_SEPARATION', 'Family Separation', 'Separated or unaccompanied children', 5, TRUE),
    (cp_id, 'CP_OTHER', 'Other Child Protection', 'Other child protection concerns', 99, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Legal Aid Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (legal_id, 'LEGAL_CIVIL', 'Civil Law', 'Civil legal matters and disputes', 1, TRUE),
    (legal_id, 'LEGAL_CRIMINAL', 'Criminal Law', 'Criminal defense and legal representation', 2, TRUE),
    (legal_id, 'LEGAL_FAMILY', 'Family Law', 'Marriage, divorce, custody, and family legal matters', 3, TRUE),
    (legal_id, 'LEGAL_LAND', 'Land & Property Disputes', 'Land disputes, property rights, and inheritance', 4, TRUE),
    (legal_id, 'LEGAL_ADMIN', 'Administrative Law', 'Documentation, registration, and administrative support', 5, TRUE),
    (legal_id, 'LEGAL_OTHER', 'Other Legal Aid', 'Other legal assistance', 99, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Psychosocial Support Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (pss_id, 'PSS_COUNSEL', 'Counseling', 'Individual and family counseling services', 1, TRUE),
    (pss_id, 'PSS_THERAPY', 'Therapy', 'Specialized therapy including trauma therapy', 2, TRUE),
    (pss_id, 'PSS_SUPPORT', 'Support Groups', 'Peer support groups and community support', 3, TRUE),
    (pss_id, 'PSS_MENTAL', 'Mental Health Services', 'Psychiatric services and mental health treatment', 4, TRUE),
    (pss_id, 'PSS_CRISIS', 'Crisis Intervention', 'Immediate crisis response and support', 5, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Economic Empowerment Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (econ_id, 'ECON_VSLA', 'Village Savings & Loans', 'VSLA groups and savings programs', 1, TRUE),
    (econ_id, 'ECON_TRAINING', 'Business Training', 'Business skills and entrepreneurship training', 2, TRUE),
    (econ_id, 'ECON_GRANT', 'Grants & Loans', 'Small grants, loans, and seed funding', 3, TRUE),
    (econ_id, 'ECON_EMPLOY', 'Employment Support', 'Job placement and employment services', 4, TRUE),
    (econ_id, 'ECON_SKILLS', 'Skills Training', 'Vocational and technical skills training', 5, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Education Support Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (edu_id, 'EDU_FEES', 'School Fees', 'School fees and tuition support', 1, TRUE),
    (edu_id, 'EDU_MATERIALS', 'School Materials', 'Books, uniforms, and supplies', 2, TRUE),
    (edu_id, 'EDU_TUTORING', 'Tutoring & Mentoring', 'Academic tutoring and mentorship', 3, TRUE),
    (edu_id, 'EDU_SCHOLAR', 'Scholarships', 'Educational scholarships and bursaries', 4, TRUE),
    (edu_id, 'EDU_SPECIAL', 'Special Needs Education', 'Support for children with special educational needs', 5, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Health Services Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (health_id, 'HEALTH_MEDICAL', 'Medical Treatment', 'General medical care and treatment', 1, TRUE),
    (health_id, 'HEALTH_REFERRAL', 'Health Referrals', 'Referrals to health facilities and specialists', 2, TRUE),
    (health_id, 'HEALTH_REPRODUCTIVE', 'Reproductive Health', 'Reproductive health services and family planning', 3, TRUE),
    (health_id, 'HEALTH_NUTRITION', 'Nutrition Support', 'Nutritional assessment and supplementation', 4, TRUE),
    (health_id, 'HEALTH_CHRONIC', 'Chronic Disease Management', 'Support for chronic health conditions', 5, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

    -- Insert Shelter Categories
    INSERT INTO case_categories (case_type_id, code, name, description, display_order, is_active) VALUES
    (shelter_id, 'SHELTER_SAFE', 'Safe House', 'Temporary safe house accommodation', 1, TRUE),
    (shelter_id, 'SHELTER_EMERGENCY', 'Emergency Shelter', 'Immediate emergency shelter provision', 2, TRUE),
    (shelter_id, 'SHELTER_TRANSIT', 'Transitional Housing', 'Medium-term transitional accommodation', 3, TRUE),
    (shelter_id, 'SHELTER_SUPPORT', 'Housing Support', 'Support to maintain or access housing', 4, TRUE)
    ON CONFLICT (case_type_id, code) DO NOTHING;

END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_categories_type_active ON case_categories(case_type_id, is_active);
CREATE INDEX IF NOT EXISTS idx_case_types_active ON case_types(is_active);

-- Print summary
DO $$
DECLARE
    type_count INTEGER;
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO type_count FROM case_types;
    SELECT COUNT(*) INTO category_count FROM case_categories;
    
    RAISE NOTICE '✅ Case types seeded: % types, % categories', type_count, category_count;
END $$;
