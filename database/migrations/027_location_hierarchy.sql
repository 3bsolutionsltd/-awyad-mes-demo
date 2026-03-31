-- Migration: 027 - Location Hierarchy (Districts + Settlements)
-- Description: Seed districts and settlements for Uganda refugee operations into system_configurations
-- Date: 2026-01-28
-- Author: Development Team

-- ============================================
-- SEED DISTRICTS
-- ============================================

INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('district', 'ADJUMANI',    'Adjumani',    'Adjumani District',    1),
('district', 'ARUA',        'Arua',        'Arua District',        2),
('district', 'KIRYANDONGO', 'Kiryandongo', 'Kiryandongo District', 3),
('district', 'YUMBE',       'Yumbe',       'Yumbe District',       4),
('district', 'KAMPALA',     'Kampala',     'Kampala',              5),
('district', 'LAMWO',       'Lamwo',       'Lamwo District',       6),
('district', 'MADI_OKOLLO', 'Madi-Okollo', 'Madi-Okollo District', 7)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- ============================================
-- SEED SETTLEMENTS (linked to districts via parent_id)
-- ============================================

DO $$
DECLARE
  adj_id  UUID;
  arua_id UUID;
  kiry_id UUID;
  yumbe_id UUID;
  lamwo_id UUID;
  madi_id UUID;
BEGIN
  SELECT id INTO adj_id   FROM system_configurations WHERE config_type='district' AND config_code='ADJUMANI';
  SELECT id INTO arua_id  FROM system_configurations WHERE config_type='district' AND config_code='ARUA';
  SELECT id INTO kiry_id  FROM system_configurations WHERE config_type='district' AND config_code='KIRYANDONGO';
  SELECT id INTO yumbe_id FROM system_configurations WHERE config_type='district' AND config_code='YUMBE';
  SELECT id INTO lamwo_id FROM system_configurations WHERE config_type='district' AND config_code='LAMWO';
  SELECT id INTO madi_id  FROM system_configurations WHERE config_type='district' AND config_code='MADI_OKOLLO';

  INSERT INTO system_configurations (config_type, config_code, config_value, parent_id, display_order) VALUES
  ('settlement', 'ADJ_AYILO1',      'Ayilo I',                adj_id,   1),
  ('settlement', 'ADJ_AYILO2',      'Ayilo II',               adj_id,   2),
  ('settlement', 'ADJ_PAGIRINYA',   'Pagirinya',              adj_id,   3),
  ('settlement', 'ADJ_NYUMANZI',    'Nyumanzi TC',            adj_id,   4),
  ('settlement', 'ARUA_RHINO',      'Rhino Camp',             arua_id,  1),
  ('settlement', 'ARUA_OCEA',       'Ocea',                   arua_id,  2),
  ('settlement', 'KIRY_SETTLEMENT', 'Kiryandongo Settlement', kiry_id,  1),
  ('settlement', 'YUMBE_BIDIBIDI',  'Bidibidi',               yumbe_id, 1),
  ('settlement', 'LAMWO_PALABEK',   'Palabek',                lamwo_id, 1),
  ('settlement', 'MADI_IMVEPI',     'Imvepi',                 madi_id,  1)
  ON CONFLICT (config_type, config_code) DO NOTHING;
END $$;
