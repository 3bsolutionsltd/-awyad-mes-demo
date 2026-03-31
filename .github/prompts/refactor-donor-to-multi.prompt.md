# Prompt: Multi-Donor Support + Donor Management UI

## Goal

Extend the donor relationship on projects from single-donor (`donor_id` FK) to
**many-to-many** (a project can have multiple donors), and add a **Donor Management
page** under the Support Data sidebar so users can create, edit, and deactivate donors
themselves — which then appear in the project form's donor picker.

---

## Current State

- `donors` table exists (created by migration `020_donors.sql`).
  Fields: `id, name, short_name, description, website, is_active, display_order,
  created_by, created_at, updated_at`.
- `projects.donor_id UUID` — single nullable FK referencing `donors(id)`.
- `projects.donor VARCHAR` — legacy text fallback (kept for display compatibility).
- `GET /api/v1/donors` — returns active donors list.
- `POST /api/v1/donors`, `PUT /api/v1/donors/:id`, `DELETE /api/v1/donors/:id` — full
  CRUD with `donors.create / .update / .delete` permission checks.
- `projects.js` Joi schemas: `donor_id: Joi.string().uuid().required()` (create),
  `donor_id: Joi.string().uuid()` (update).
- `public/js/projectForms.js` — renders `<select name="donor_id" required>` (single).
- `public/js/renderProjects.js` — displays `project.donor_name || project.donor`.
- No `project_donors` junction table yet.
- Donor management UI does **not** exist yet — donors can only be added by seeding.

---

## Target State

1. A `project_donors` junction table enables many-to-many between projects and donors.
2. The project create / edit forms show a **multi-select** donor picker; at least one
   donor must be selected.
3. The project list and view modal show **donor badges** (like components do).
4. A new **Donors** page is added under the Support Data section so any admin user can
   add, edit, and deactivate donors, and those donors immediately appear in the project
   form picker.

---

## Pattern References (already in codebase — follow these exactly)

| Pattern | File |
|---------|------|
| Many-to-many junction (components) | `database/migrations/019_project_components.sql` |
| `component_ids` array in API | `src/server/routes/projects.js` (GET/POST/PUT sections) |
| Multi-select + badge display (frontend) | `public/js/projectForms.js` components section |
| Support-data management CRUD UI | `public/js/supportData.js` |
| Navigation sidebar item | `public/index.html` admin `<li>` items |
| Route registration | `public/js/navigation.js` `routes` object |
| Navigation import | `public/js/navigation.js` import block |

---

## Step-by-Step Implementation Plan

---

### Step 1 — Database Migration `021_project_donors.sql`

Create `database/migrations/021_project_donors.sql`:

```sql
-- 1. Junction table: projects ↔ donors (many-to-many)
CREATE TABLE IF NOT EXISTS project_donors (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    donor_id   UUID NOT NULL REFERENCES donors(id)   ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_project_donors_project ON project_donors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_donors_donor   ON project_donors(donor_id);

-- 2. Back-fill from existing single donor_id on projects
INSERT INTO project_donors (project_id, donor_id)
SELECT id, donor_id
FROM projects
WHERE donor_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Remove the now-redundant single donor_id FK from projects
--    (keep the legacy `donor` text column for display fallback)
ALTER TABLE projects DROP COLUMN IF EXISTS donor_id;
```

Run via the standard migration runner: `node database/migrate.js`

---

### Step 2 — Update `src/server/routes/projects.js`

#### 2a. Joi schemas

Replace the single `donor_id` field with a `donor_ids` array in both schemas:

```js
// createProjectSchema
donor_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),

// updateProjectSchema
donor_ids: Joi.array().items(Joi.string().uuid()).min(1),
```

Remove any remaining `donor_id: Joi.string().uuid()` lines.

#### 2b. GET / (list) and GET /:id (single)

Remove `LEFT JOIN donors don ON p.donor_id = don.id` and `don.name AS donor_name`.

Add a correlated subquery to each SELECT that returns an array of donor objects, exactly
mirroring the `components` subquery pattern:

```sql
COALESCE(
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', d.id, 'name', d.name) ORDER BY d.name)
     FROM project_donors pd
     JOIN donors d ON pd.donor_id = d.id
     WHERE pd.project_id = p.id),
    '[]'::json
) AS donors
```

The returned project row will have `donors: [{id, name}, …]`.

#### 2c. POST / (create)

1. Extract `donor_ids` from validated body (remove `donor_id`).
2. Validate each donor exists:
   ```js
   for (const did of donor_ids) {
       const d = await databaseService.queryOne(
           'SELECT id, name FROM donors WHERE id = $1 AND is_active = true', [did]);
       if (!d) return res.status(400).json({ success: false, message: `Donor ${did} not found` });
   }
   ```
3. After inserting the project row remove any INSERT of `donor_id`.
   Set the legacy `donor` text column to a comma-joined list of names for display
   fallback (same approach as `component_ids` sets nothing, but here update the text):
   ```sql
   UPDATE projects SET donor = $1 WHERE id = $2
   -- $1 = donors.map(d => d.name).join(', ')
   ```
4. Insert junction rows (copy the `component_ids` pattern exactly):
   ```js
   for (const did of donor_ids) {
       await databaseService.query(
           'INSERT INTO project_donors (project_id, donor_id) VALUES ($1, $2)',
           [projectId, did]);
   }
   ```

#### 2d. PUT /:id (update)

When `donor_ids` is present in the update body:

1. Validate each donor (same as above).
2. Replace junction rows atomically:
   ```sql
   DELETE FROM project_donors WHERE project_id = $1;
   -- then re-insert each donor_id
   ```
3. Update the legacy `donor` text column to the new comma-joined names.

---

### Step 3 — Update `public/js/projectForms.js`

#### 3a. Create modal — replace single `<select>` with multi-select

Replace:
```html
<div class="mb-3">
    <label for="projectDonor" class="form-label">Donor <span class="text-danger">*</span></label>
    <select class="form-select" id="projectDonor" name="donor_id" required>
        <option value="">Select Donor</option>
        ${donors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
    </select>
</div>
```

With:
```html
<div class="mb-3">
    <label for="projectDonors" class="form-label">
        Donor(s) <span class="text-danger">*</span>
    </label>
    <select class="form-select" id="projectDonors" name="donor_ids" multiple required size="4">
        ${donors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
    </select>
    <div class="form-text">Hold Ctrl / Cmd to select multiple donors.</div>
</div>
```

#### 3b. Create form submit handler

Add extraction of multi-select values before the API call (mirroring `component_ids`):
```js
const selectedDonors = [...document.getElementById('projectDonors').selectedOptions]
    .map(o => o.value);
data.donor_ids = selectedDonors;
delete data.donor_id; // remove legacy field if present
```

Validate at least one is selected client-side and show an error if empty.

#### 3c. Edit modal — multi-select with pre-selection

Replace the single-select with the same multi-select HTML as in 3a.

Pre-select based on the project's `donors` array (not `donor_id`):
```js
const selectedIds = new Set((project.donors || []).map(d => d.id));
donors.map(d => `<option value="${d.id}" ${selectedIds.has(d.id) ? 'selected' : ''}>${d.name}</option>`)
```

Apply the same submit handler extraction (3b) for edit.

#### 3d. View modal — render donor badges

Replace:
```js
project.donor_name || project.donor
```

With:
```js
(project.donors && project.donors.length > 0)
    ? project.donors.map(d =>
        `<span class="badge bg-info text-dark me-1">${d.name}</span>`).join('')
    : (project.donor || '<span class="text-muted">N/A</span>')
```

---

### Step 4 — Update `public/js/renderProjects.js`

Find the cell that currently renders `project.donor_name || project.donor` and replace it
with donor badges (keep it concise for table cells):

```js
// In the table row template
(project.donors && project.donors.length > 0)
    ? project.donors.map(d =>
        `<span class="badge bg-info text-dark me-1">${d.name}</span>`).join('')
    : (project.donor || '<span class="text-muted">N/A</span>')
```

---

### Step 5 — Create `public/js/donorManagement.js`

New file. Follow the `supportData.js` pattern (single-file CRUD module, no separate forms
file needed). This module renders a full management page for the `donors` table.

**Structure:**

```js
import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';

export async function renderDonorManagement(container) {
    // Show spinner → _refresh(container)
}

async function _refresh(container) {
    const res = await apiService.get('/donors?include_inactive=true');
    const donors = res.data || [];
    container.innerHTML = _buildPage(donors);
    _attachHandlers(container, donors, () => _refresh(container));
}
```

**Page layout** (Bootstrap 5 cards, same style as `supportData.js`):

- Header: "Donor Management" title + subtitle + "Add Donor" button (right-aligned).
- Summary cards: Total Donors | Active | Inactive.
- Table columns: `#` | Name | Short Name | Website | Status (badge) | Actions.
  - Actions: Edit button (pencil icon) + Deactivate/Activate toggle button.
- Empty state: friendly message if no donors yet.

**Create / Edit modal** (via `createModal({ ... })`):

Fields:
| Field | Type | Validation |
|-------|------|------------|
| Name | `<input type="text" required maxlength="150">` | Required |
| Short Name | `<input type="text" maxlength="50">` | Optional |
| Description | `<textarea rows="2">` | Optional |
| Website | `<input type="url">` | Optional |
| Active | `<input type="checkbox" checked>` | Boolean |

On submit:
- If `donor.id` exists → `PUT /api/v1/donors/:id`
- Else → `POST /api/v1/donors`
- On success → close modal, call `_refresh(container)`, `showNotification('Donor saved.')`
- On error → display error inside modal (do not close).

**Deactivate / Activate button:**

```js
window.toggleDonorActive = async (id, currentlyActive) => {
    await apiService.put(`/donors/${id}`, { is_active: !currentlyActive });
    showNotification(currentlyActive ? 'Donor deactivated.' : 'Donor activated.');
    _refresh(container);
};
```

Note: The `DELETE /api/v1/donors/:id` endpoint does a soft-delete (sets `is_active = false`)
and returns 409 if the donor has active projects. Surface-deactivation via `PUT` is the
safe UX choice here; skip the hard-delete button.

---

### Step 6 — Add "Donors" nav item to `public/index.html`

In the admin sidebar (`data-role="admin"`), after the existing "Support Data" `<li>`,
add a new entry:

```html
<li class="nav-item" data-role="admin" style="display: none;">
    <a class="nav-link text-white" data-nav="donors">
        <i class="bi bi-people-fill"></i> Donors
    </a>
</li>
```

---

### Step 7 — Register route in `public/js/navigation.js`

#### 7a. Import the new module

At the top of `navigation.js`, alongside the other admin imports:
```js
import { renderDonorManagement } from './donorManagement.js';
```

#### 7b. Add to the `routes` object

```js
'donors': renderDonorManagement,
```

Place it near the other admin routes (`users`, `audit-logs`, `permissions`, `thematic-areas`).

---

## Acceptance Criteria

- [ ] Migration `021_project_donors.sql` runs cleanly, back-fills existing `donor_id` data,
      and removes `donor_id` from `projects`.
- [ ] `GET /api/v1/projects` returns `donors: [{id, name}, …]` array on each project row.
- [ ] Creating a project with `donor_ids: [uuid1, uuid2]` persists both rows in
      `project_donors` and sets the legacy `donor` text to their comma-joined names.
- [ ] Editing the donors on a project replaces the junction rows correctly.
- [ ] Create / Edit project modals show a multi-select donor picker; held Ctrl/Cmd selects
      multiple; edit mode pre-selects current donors.
- [ ] Project list table and view modal show donor badges (not a single name).
- [ ] Navigating to `#donors` renders the Donor Management page.
- [ ] An admin can add a new donor via the "Add Donor" modal; it immediately appears in the
      project form donor picker.
- [ ] An admin can edit a donor's name / details.
- [ ] An admin can deactivate a donor (it disappears from the project form picker but
      remains visible in the management table with an "Inactive" badge).
- [ ] No TypeErrors or 400 errors when creating/editing projects with multiple donors.
- [ ] Legacy `project.donor` text column is kept and updated as a comma-joined fallback.

---

## Files to Create / Modify

| Action | Path |
|--------|------|
| **CREATE** | `database/migrations/021_project_donors.sql` |
| **MODIFY** | `src/server/routes/projects.js` |
| **MODIFY** | `public/js/projectForms.js` |
| **MODIFY** | `public/js/renderProjects.js` |
| **CREATE** | `public/js/donorManagement.js` |
| **MODIFY** | `public/index.html` |
| **MODIFY** | `public/js/navigation.js` |

The existing `src/server/routes/donors.js` and the `donors` table require **no changes**.
