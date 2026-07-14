-- Migration 037: Support multiple thematic areas per organizational indicator
-- Creates many-to-many linkage table and backfills existing AWYAD indicator mappings.

CREATE TABLE IF NOT EXISTS indicator_thematic_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    thematic_area_id UUID NOT NULL REFERENCES thematic_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indicator_id, thematic_area_id)
);

CREATE INDEX IF NOT EXISTS idx_indicator_thematic_areas_indicator_id
    ON indicator_thematic_areas(indicator_id);

CREATE INDEX IF NOT EXISTS idx_indicator_thematic_areas_thematic_area_id
    ON indicator_thematic_areas(thematic_area_id);

-- Backfill existing AWYAD single thematic area links into the new mapping table.
INSERT INTO indicator_thematic_areas (indicator_id, thematic_area_id)
SELECT i.id, i.thematic_area_id
FROM indicators i
WHERE i.indicator_scope = 'awyad'
  AND i.thematic_area_id IS NOT NULL
ON CONFLICT (indicator_id, thematic_area_id) DO NOTHING;
