-- Migration 019: Project Components Junction Table
-- Replaces single thematic_area_id FK with many-to-many relationship to core_program_components
-- The thematic_area_id column is retained for backward compatibility but is no longer required.

CREATE TABLE IF NOT EXISTS project_components (
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES core_program_components(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, component_id)
);

CREATE INDEX IF NOT EXISTS idx_project_components_project_id   ON project_components(project_id);
CREATE INDEX IF NOT EXISTS idx_project_components_component_id ON project_components(component_id);
