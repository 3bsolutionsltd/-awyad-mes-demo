# Prompt: Refactor Donor Field to Lookup from Donors Table

## Goal

Replace the free-text `donor` input in the project creation and edit forms with a
`<select>` dropdown backed by a dedicated `donors` table. This ensures data integrity
(no typos, consistent names), enables donor-level reporting, and allows administrators
to manage the list of donors independently.

---

## Current State

- `projects.donor` → `VARCHAR(100) NOT NULL` — free text typed by the user.
- No `donors` table exists.
- No `/api/v1/donors` route exists.
- Create form: `<input type="text" … name="donor">` in `public/js/projectForms.js`.
- Edit form: same pattern, pre-filled with `project.donor`.
- Joi schema: `donor: Joi.string().required().max(100)` (create) / optional (update).

---

## Target State

1. A `donors` table stores canonical donor records.
2. `projects.donor_id` (UUID FK) replaces `projects.donor` (VARCHAR).
   - Keep `projects.donor` as a nullable fallback column during transition so
     existing data is not lost; populate it via a one-time migration.
3. A full CRUD REST API at `/api/v1/donors`.
4. Create / Edit project modals show a `<select>` populated from `GET /api/v1/donors`.
5. The View project modal shows the donor name (not an ID).

---

## Step-by-Step Implementation Plan

---

### Step 1 — Database Migration `020_donors.sql`

Create file `database/migrations/020_donors.sql`:

```sql
-- 1. Donors master table
CREATE TABLE IF NOT EXISTS donors (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL UNIQUE,
    short_name  VARCHAR(50),
    description TEXT,
    website     VARCHAR(255),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    display_order INT        NOT NULL DEFAULT 0,
    created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_active ON donors(is_active);

-- 2. Seed common donors from existing project data
INSERT INTO donors (name)
SELECT DISTINCT TRIM(donor)
FROM   projects
WHERE  donor IS NOT NULL AND TRIM(donor) <> ''
ON CONFLICT (name) DO NOTHING;

-- 3. Add donor_id FK to projects (nullable at first for safe migration)
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES donors(id) ON DELETE SET NULL;

-- 4. Back-fill donor_id from existing donor text values
UPDATE projects p
SET    donor_id = d.id
FROM   donors d
WHERE  TRIM(p.donor) = d.name
  AND  p.donor_id IS NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_projects_donor_id ON projects(donor_id);
```

> **Note:** Do NOT drop `projects.donor` yet. It stays as a soft fallback, populated
> by the API for backward compat. A future migration can drop it once all clients use
> `donor_id`.

---

### Step 2 — Donors REST API `src/server/routes/donors.js`

Create `src/server/routes/donors.js` with the following endpoints:

#### `GET /api/v1/donors`
- Returns all active donors, ordered by `display_order ASC, name ASC`.
- Query param `include_inactive=true` returns all donors.
- Response: `{ success: true, data: [...], count: N }`
- Each donor object: `{ id, name, short_name, description, website, is_active, display_order }`
- Use `databaseService.queryMany()`.
- Auth: `authenticate` middleware only (no special permission needed for reading).

#### `GET /api/v1/donors/:id`
- Returns single donor by UUID. 404 if not found.
- Include a `projects` summary: count of projects linked to this donor.

#### `POST /api/v1/donors`
- Creates a new donor.
- Joi schema:
  ```js
  name:          Joi.string().required().max(150),
  short_name:    Joi.string().max(50).allow('', null),
  description:   Joi.string().allow('', null),
  website:       Joi.string().uri().max(255).allow('', null),
  is_active:     Joi.boolean().default(true),
  display_order: Joi.number().integer().min(0).default(0),
  ```
- Sets `created_by = req.user.id`.
- Auth: `authenticate` + `checkPermission('donors.create')`.

#### `PUT /api/v1/donors/:id`
- Updates a donor. All fields optional (`.min(1)`).
- Auth: `authenticate` + `checkPermission('donors.update')`.

#### `DELETE /api/v1/donors/:id`
- Soft-delete: sets `is_active = false`. Does NOT delete the row (preserves FK links).
- Returns 409 if donor has active projects linked to it (warn the user).
- Auth: `authenticate` + `checkPermission('donors.delete')`.

---

### Step 3 — Register Route in `src/server/routes/index.js`

Find the existing route registrations and add:

```js
import donorsRouter from './donors.js';
// …
router.use('/donors', donorsRouter);
```

Place it near the other resource routes (e.g., after `projects`).

---

### Step 4 — Update `src/server/routes/projects.js`

#### Joi schemas
Replace `donor: Joi.string().required().max(100)` with:
```js
donor_id: Joi.string().uuid().required(),
```
In the update schema, make it optional:
```js
donor_id: Joi.string().uuid(),
```
Remove the old `donor` field from both schemas.

#### `POST /` — Create project
- Use `donor_id` from validated body.
- When inserting, also set `donor = (SELECT name FROM donors WHERE id = $donor_id)`
  so the legacy text column stays in sync.
- Alternatively, set `donor = value.donor_id` temporarily and fix in a JOIN.
- Preferred INSERT approach:
  ```sql
  INSERT INTO projects (name, donor_id, donor, description, …)
  SELECT $1, $2, d.name, $3, …
  FROM donors d WHERE d.id = $2
  ```

#### `PUT /:id` — Update project
- If `donor_id` is provided, update both `donor_id` and `donor` (from donors table).

#### `GET /` and `GET /:id`
- Join `donors` table to include `donor_name` in the response:
  ```sql
  LEFT JOIN donors don ON p.donor_id = don.id
  ```
  Add to SELECT: `COALESCE(don.name, p.donor) as donor_name, p.donor_id`

---

### Step 5 — Update `public/js/projectForms.js`

#### `showCreateProjectModal`

- Add `apiService.get('/donors')` to the data fetch (alongside the existing pillars fetch):
  ```js
  const [pillarsRes, donorsRes] = await Promise.all([
      apiService.get('/pillars'),
      apiService.get('/donors'),
  ]);
  const pillars = Array.isArray(pillarsRes.data) ? pillarsRes.data : [];
  const donors = Array.isArray(donorsRes.data) ? donorsRes.data : [];
  ```

- Replace the donor `<input>` with a `<select>`:
  ```html
  <div class="mb-3">
      <label for="projectDonor" class="form-label">Donor <span class="text-danger">*</span></label>
      <select class="form-select" id="projectDonor" name="donor_id" required>
          <option value="">Select Donor</option>
          ${donors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
      </select>
  </div>
  ```

- The submit handler uses `Object.fromEntries(formData.entries())` which will capture
  `donor_id` automatically from the named select — no extra JS needed.

#### `showEditProjectModal`

- Same parallel fetch change — add `apiService.get('/donors')`.
- Replace donor `<input>` with `<select>`, pre-select using `project.donor_id`:
  ```html
  <select class="form-select" id="editProjectDonor" name="donor_id" required>
      <option value="">Select Donor</option>
      ${donors.map(d => `<option value="${d.id}" ${d.id === project.donor_id ? 'selected' : ''}>${d.name}</option>`).join('')}
  </select>
  ```

#### `showViewProjectModal`

- Display `project.donor_name` (from updated API JOIN) instead of `project.donor`.

---

### Step 6 — Update `renderProjects.js` (projects table column)

No structural change needed — the table already shows `project.donor`.
After the API change, ensure it falls back to `project.donor_name || project.donor`.

---

## Acceptance Criteria

- [ ] `database/migrations/020_donors.sql` runs via `node database/migrate.js` without error.
- [ ] All existing project rows have `donor_id` populated (check: `SELECT COUNT(*) FROM projects WHERE donor_id IS NULL`).
- [ ] `GET /api/v1/donors` returns an array, each item having `id` and `name`.
- [ ] Create project form: Donor field is a `<select>` populated with donor names.
- [ ] Edit project form: Donor `<select>` pre-selects the project's current donor.
- [ ] View project modal shows the donor name correctly.
- [ ] Creating a project without selecting a donor is blocked (required validation).
- [ ] Projects list table still shows donor name correctly.
- [ ] No regression in existing project CRUD operations.

---

## Files to Create / Modify

| Action | File |
|--------|------|
| CREATE | `database/migrations/020_donors.sql` |
| CREATE | `src/server/routes/donors.js` |
| MODIFY | `src/server/routes/index.js` — register `/donors` route |
| MODIFY | `src/server/routes/projects.js` — `donor_id` FK, JOIN in GET queries |
| MODIFY | `public/js/projectForms.js` — select in create/edit/view modals |
| MODIFY | `renderProjects.js` — use `donor_name` fallback |
