-- Migration: 028 - Dynamic Lookups (Age Groups, Nationalities, Nationality Breakdown Table)
-- Description: Age groups and nationalities as managed config; activity nationality breakdown table
-- Date: 2026-01-28
-- Author: Development Team

-- ============================================
-- SEED AGE GROUPS
-- ============================================

INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('age_group', '0_4',   '0-4',   '0 to 4 years',    1),
('age_group', '5_11',  '5-11',  '5 to 11 years',   2),
('age_group', '12_17', '12-17', '12 to 17 years',  3),
('age_group', '18_59', '18-59', '18 to 59 years',  4),
('age_group', '60_PLUS', '60+', '60 years and above', 5)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- ============================================
-- SEED NATIONALITIES
-- ============================================

INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('nationality', 'SUDANESE',       'Sudanese',                  'Sudan',                     1),
('nationality', 'CONGOLESE',      'Congolese (DRC)',            'Democratic Republic of Congo', 2),
('nationality', 'SOUTH_SUDANESE', 'South Sudanese',            'South Sudan',               3),
('nationality', 'SOMALI',         'Somali',                    'Somalia',                   4),
('nationality', 'RWANDESE',       'Rwandese',                  'Rwanda',                    5),
('nationality', 'BURUNDIAN',      'Burundian',                 'Burundi',                   6),
('nationality', 'ERITREAN',       'Eritrean',                  'Eritrea',                   7),
('nationality', 'UGANDAN',        'Ugandan (host community)',  'Uganda',                    8),
('nationality', 'OTHER',          'Other',                     'Other nationality',          99)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- ============================================
-- ACTIVITY NATIONALITY BREAKDOWN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_nationality_breakdown (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id     UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    nationality_id  UUID NOT NULL REFERENCES system_configurations(id) ON DELETE RESTRICT,
    count           INTEGER NOT NULL DEFAULT 0,
    UNIQUE (activity_id, nationality_id)
);

CREATE INDEX IF NOT EXISTS idx_anb_activity ON activity_nationality_breakdown(activity_id);
