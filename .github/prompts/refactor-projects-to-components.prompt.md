---
name: "Refactor Projects — Thematic Areas → Core Program Components"
description: "Use when: replacing thematic_area_id on projects with multi-select Core Program Components. Covers DB migration, backend API, and frontend form changes."
agent: agent
---

# Task: Refactor Project Form — Replace Thematic Areas with Core Program Components

## Context

### Current State
- Projects have a single FK `thematic_area_id` linking to the `thematic_areas` table (one-to-one).
- The project creation/edit form at [public/js/projectForms.js](../../public/js/projectForms.js) renders a single dropdown for thematic area.
- The API at [src/server/routes/projects.js](../../src/server/routes/projects.js) accepts and validates `thematic_area_id`.
- A `core_program_components` table already exists in [database/schema_v2.sql](../../database/schema_v2.sql), linked via `strategies → pillars → core_program_components`.
- The API for components already exists at [src/server/routes/components.js](../../src/server/routes/components.js).

### Target State
- A project can belong to **one or more** Core Program Components (many-to-many).
- The project form replaces the "Thematic Area" single-select with a **multi-select** for "Core Program Components".
- `thematic_area_id` is retained on the DB for backward compatibility but is no longer required or shown in the form.

---

## Required Changes

### 1. Database Migration
Create a new migration file at `database/migrations/` (or apply directly via `database/apply_0XX.js`):

```sql
-- Junction table: many-to-many between projects and core_program_components
CREATE TABLE IF NOT EXISTS project_components (
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES core_program_components(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, component_id)
);

CREATE INDEX IF NOT EXISTS idx_project_components_project_id   ON project_components(project_id);
CREATE INDEX IF NOT EXISTS idx_project_components_component_id ON project_components(component_id);
```

### 2. Backend — Projects API (`src/server/routes/projects.js`)

**GET /projects and GET /projects/:id**
- JOIN `project_components` and return `component_ids: UUID[]` in each project response.
- Also return full component names for display: `components: [{id, name}]`.

**POST /projects (create)**
- Accept `component_ids: array of UUID` (required, min 1).
- Remove `thematic_area_id` as required; make it optional.
- After inserting the project row, insert rows into `project_components`.

**PUT /projects/:id (update)**
- Accept `component_ids: array of UUID` (optional).
- If provided, delete existing `project_components` for this project and re-insert.

**Validation (Joi)**
```js
component_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
```

### 3. Backend — Data Service (`src/server/services/dataService.js`)
If `USE_DATABASE=false` (JSON mode), update the in-memory project data model to include a `component_ids` array field and mock component names accordingly.

### 4. Frontend — Project Form (`public/js/projectForms.js`)

**Replace** the `thematic_area_id` single `<select>` with a grouped multi-select for Core Program Components.

**Fetch data:** Call `GET /api/v1/pillars` (with their components nested, or make a second call to `GET /api/v1/components`) to get components grouped under their parent pillar.

**Render as `<optgroup>` per pillar:**

```html
<div class="mb-3">
  <label class="form-label">Core Program Components <span class="text-danger">*</span></label>
  <select id="component_ids" name="component_ids" class="form-select" multiple required size="7">
    <!-- grouped dynamically; example output: -->
    <optgroup label="Protection">
      <option value="uuid-1">Case Management</option>
      <option value="uuid-2">Legal Aid & Documentation</option>
    </optgroup>
    <optgroup label="MHPSS">
      <option value="uuid-3">Psychosocial Support</option>
      <option value="uuid-4">Community-Based PSS</option>
    </optgroup>
  </select>
  <div class="form-text">Hold <kbd>Ctrl</kbd> / <kbd>⌘ Cmd</kbd> to select multiple components.</div>
</div>
```

**JS population logic:**
```js
// 1. Fetch pillars with nested components
const pillarsRes = await fetch('/api/v1/pillars');
const { data: pillars } = await pillarsRes.json();

// 2. For each pillar, create an <optgroup>; for each component, create an <option>
const select = document.getElementById('component_ids');
for (const pillar of pillars) {
  const group = document.createElement('optgroup');
  group.label = pillar.name;
  for (const comp of pillar.components || []) {
    const opt = document.createElement('option');
    opt.value = comp.id;
    opt.textContent = comp.name;
    // Pre-select on edit:
    if (existingComponentIds.includes(comp.id)) opt.selected = true;
    group.appendChild(opt);
  }
  select.appendChild(group);
}
```

> **Note:** If `GET /api/v1/pillars` does not already return nested `components`, update the pillars route to JOIN `core_program_components` and include them in the response. Alternatively, fetch both endpoints separately and merge client-side.

- On form submit, collect all selected `<option>` values: `[...select.selectedOptions].map(o => o.value)` → send as `component_ids`.
- Remove the thematic area dropdown (or hide it — do NOT delete if other views still reference it).

### 5. Frontend — Project Display / Cards
Wherever project data is rendered (e.g., `renderProjects.js`, project dashboard cards), replace the single "Thematic Area" badge with a list of component name badges:
```html
<!-- Before -->
<span class="badge bg-info">{{ project.thematic_area }}</span>

<!-- After -->
{{ project.components.map(c => `<span class="badge bg-primary">${c.name}</span>`).join(' ') }}
```

---

## Acceptance Criteria

- [ ] `project_components` junction table created and indexed.
- [ ] `POST /api/v1/projects` accepts `component_ids[]` and inserts into junction table.
- [ ] `GET /api/v1/projects` returns `components: [{id, name}]` on each project.
- [ ] `PUT /api/v1/projects/:id` replaces component assignments when `component_ids` is provided.
- [ ] Project form multi-select loads all active components **grouped by pillar** using `<optgroup>`.
- [ ] Creating/editing a project with multiple components saves all selections.
- [ ] Existing project cards/lists display component names instead of thematic area name.
- [ ] No regression on projects that already exist (backfill or graceful empty-component display).

---

## Files to Change

| File | Change Type |
|------|-------------|
| `database/migrations/add_project_components.sql` | **CREATE** — junction table migration |
| `src/server/routes/projects.js` | **MODIFY** — API validation + queries |
| `src/server/services/dataService.js` | **MODIFY** — JSON-mode in-memory support |
| `src/server/routes/pillars.js` | **MODIFY** — include nested `components[]` in response |
| `public/js/projectForms.js` | **MODIFY** — replace dropdown with grouped multi-select |
| `renderProjects.js` | **MODIFY** — display component badges |

---

## Notes / Constraints

- `USE_DATABASE` env flag controls whether PostgreSQL or JSON in-memory storage is used. Changes must work in **both** modes.
- The `core_program_components` API endpoint is at `GET /api/v1/components` — verify this is the correct path before wiring the frontend.
- Keep `thematic_area_id` column on the `projects` table for backward-compatibility — just stop requiring/showing it in the form.
