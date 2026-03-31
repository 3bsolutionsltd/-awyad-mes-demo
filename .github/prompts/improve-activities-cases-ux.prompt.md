---
mode: agent
description: "Use when: implementing the batch of UX/data improvements for Activities and Case Management. Covers location hierarchy, dynamic lookups, nationality disaggregation, and case form cleanup."
---

# Task: Activities & Case Management — UX and Data Improvements

## Overview

This prompt covers **8 related changes** to the Activities and Case Management modules. Apply them in the order listed — later changes depend on earlier ones.

---

## 1. Location: Replace flat field with District → Settlement/Transit Center cascade

### What to build
Replace the single `location` text/dropdown on the **New/Edit Activity** modal with two linked dropdowns:
1. **District** — top-level dropdown
2. **Settlement / Transit Center** — filtered by selected district

### Data storage
Location data is **user-managed** at runtime (not hardcoded). Store in `system_configurations` table (already exists) using:
- `config_type = 'district'` for district rows
- `config_type = 'settlement'` for settlement rows, with `parent_id` pointing to the district row

### DB migration
Create `database/migrations/020_location_hierarchy.sql`:
```sql
-- Ensure parent_id column supports the hierarchy (already exists in 008)
-- Seed example districts and settlements for Uganda refugee operations
INSERT INTO system_configurations (config_type, config_code, config_value, display_order) VALUES
('district','ADJUMANI','Adjumani',1),
('district','ARUA','Arua',2),
('district','KIRYANDONGO','Kiryandongo',3),
('district','YUMBE','Yumbe',4),
('district','KAMPALA','Kampala',5)
ON CONFLICT DO NOTHING;

-- Settlements linked to districts via parent_id
-- Use a DO block to look up parent UUIDs dynamically
DO $$
DECLARE adj_id UUID; arua_id UUID; kiry_id UUID; yumbe_id UUID;
BEGIN
  SELECT id INTO adj_id  FROM system_configurations WHERE config_type='district' AND config_code='ADJUMANI';
  SELECT id INTO arua_id FROM system_configurations WHERE config_type='district' AND config_code='ARUA';
  SELECT id INTO kiry_id FROM system_configurations WHERE config_type='district' AND config_code='KIRYANDONGO';
  SELECT id INTO yumbe_id FROM system_configurations WHERE config_type='district' AND config_code='YUMBE';

  INSERT INTO system_configurations (config_type, config_code, config_value, parent_id, display_order) VALUES
  ('settlement','ADJUMANI_AYILO1','Ayilo I',adj_id,1),
  ('settlement','ADJUMANI_AYILO2','Ayilo II',adj_id,2),
  ('settlement','ADJUMANI_PAGIRINYA','Pagirinya',adj_id,3),
  ('settlement','ARUA_RHINO','Rhino Camp',arua_id,1),
  ('settlement','ARUA_OCEA','Ocea',arua_id,2),
  ('settlement','KIRY_KIRYANDONGO','Kiryandongo Settlement',kiry_id,1),
  ('settlement','YUMBE_BIDIBIDI','Bidibidi',yumbe_id,1)
  ON CONFLICT DO NOTHING;
END $$;
```

### Backend changes
In `src/server/routes/activities.js`:
- Replace `location: Joi.string()` with `district_id: Joi.string().uuid().allow(null)` and `settlement_id: Joi.string().uuid().allow(null)`
- Update INSERT/UPDATE queries accordingly (store both IDs; `location` column can remain as a computed string `district_name + ' / ' + settlement_name` for backward compatibility)

Add a new API endpoint in `src/server/routes/supportData.js` (or create it):
```
GET /api/v1/support-data/districts           → all district configs
GET /api/v1/support-data/settlements/:districtId  → settlements filtered by parent_id
```

### Frontend changes
In the Activity modal (find in `public/js/` — likely `renderActivities.js`, `activityForms.js`, or inside `public/index.html`):
- Replace location field with:
```html
<div class="row g-2">
  <div class="col-md-6">
    <label class="form-label">District <span class="text-danger">*</span></label>
    <select class="form-select" id="activity-district" required>
      <option value="">Select District...</option>
    </select>
  </div>
  <div class="col-md-6">
    <label class="form-label">Settlement / Transit Center</label>
    <select class="form-select" id="activity-settlement" disabled>
      <option value="">Select Settlement...</option>
    </select>
  </div>
</div>
```
- On district change: fetch settlements and populate the second dropdown; enable it.
- On form load: if editing, pre-select both values.

### Support Data management
In `public/js/supportData.js`, add a new **Locations** tab/section alongside the existing Case Types section:
- List districts with an **Add District** button
- In each district row, show a toggle to expand/view its settlements, with **Add Settlement** button
- Use the existing `system_configurations` CRUD pattern already in supportData.js

---

## 2. Remove "Thematic Area" from Activity form

### What to change
- In the Activity **New/Edit** modal, remove the Thematic Area dropdown field entirely.
- **Do not** remove `thematic_area_id` from the DB column or API response (keep for backward compat).
- In `src/server/routes/activities.js`: keep `thematic_area_id` as `Joi.string().uuid().allow(null, '')` (already optional) — no change needed there.
- In the activity list/table view, also remove the "Thematic Area" column if present.

---

## 3. New Activity from Project Dashboard — auto-fill Project + filter Indicators

### Context
`public/js/renderProjectDashboard.js` likely has an "Add Activity" button for a specific project.

### What to change
When the New Activity modal is opened **from a project dashboard**:
1. Pre-populate and **lock** the Project field to the current project (hidden input or disabled select showing project name)
2. Filter the Indicator dropdown to only show indicators belonging to that project (`project_id = X`)
3. Pass the `projectId` context through the modal trigger, e.g.:
```js
openActivityModal({ projectId: currentProject.id, projectName: currentProject.name })
```

In the modal's indicator fetch, change:
```js
// Before: fetch all indicators
const indicators = await apiService.getIndicators({ limit: 1000 });
// After: fetch filtered by project
const indicators = projectId
  ? await apiService.getIndicators({ project_id: projectId, limit: 1000 })
  : await apiService.getIndicators({ limit: 1000 });
```

---

## 4. Fix Case Management tool (Support Data) not showing on deployed site

### Problem
The Case Types / Case Category management panel in `public/js/supportData.js` works locally but not on the deployed site.

### Investigation steps
1. Check if the Support Data nav link exists in `public/index.html` — look for `data-nav="support-data"` or similar.
2. Check if `supportData.js` is imported in `index.html` with a `<script>` tag.
3. Check if the route/section render is guarded by a role check — the deployed admin user may have role name `'admin'` (lowercase) while the check may look for `'Admin'` (capitalized). Normalize the comparison to lowercase.
4. Check browser console on the deployed site for JS errors when clicking the Support Data menu item.

### Likely fix — role name case mismatch
In `supportData.js` and any role guard:
```js
// Change:
if (userRole === 'Admin')
// To:
if (userRole?.toLowerCase() === 'admin')
```

---

## 5. Cases Modal — Remove duplicate: keep "Referred From", remove "Case Source"

### Context
Both `case_source` and `referred_from` capture where the case came from. Keep **Referred From** as it is more descriptive.

### Changes
In the Case create/edit modal (find in `public/js/` — likely `renderCaseManagement.js` or within `index.html`):
- Remove the `case_source` form field entirely.

In `src/server/routes/cases.js` (or `casesNew.js`):
- Remove `case_source` from Joi validation schema (or make it `Joi.any().strip()`)
- Remove `case_source` from INSERT/UPDATE column lists

**Do not** drop the `case_source` column from the DB — just stop collecting it in the UI.

---

## 6. Age Group — dynamic, per-program management

### What to build
Age groups vary by project/program. Replace any hardcoded age group options with a user-managed list stored in `system_configurations`:
- `config_type = 'age_group'`
- Optional: `metadata = {"program_id": "..."}` to scope to a specific program (leave as null for global groups)

### DB migration
Add to `database/migrations/020_location_hierarchy.sql` (or a new `021_dynamic_lookups.sql`):
```sql
INSERT INTO system_configurations (config_type, config_code, config_value, display_order) VALUES
('age_group','0_4','0-4 years',1),
('age_group','5_11','5-11 years',2),
('age_group','12_17','12-17 years',3),
('age_group','18_59','18-59 years',4),
('age_group','60_PLUS','60+ years',5)
ON CONFLICT DO NOTHING;
```

### Backend
Add `GET /api/v1/support-data/age-groups` returning `system_configurations WHERE config_type = 'age_group'`.

### Frontend
- In the Case modal, populate age group options dynamically from the API.
- In Support Data section, add an **Age Groups** tab (same pattern as Case Types / Locations).

---

## 7. Nationality — dynamic, managed by user

### What to change
Currently `activities` table has hardcoded columns: `nationality_sudanese`, `nationality_congolese`, `nationality_south_sudanese`, `nationality_others`.

Replace with a dynamic approach:
- Store nationalities in `system_configurations` with `config_type = 'nationality'`
- Store disaggregated values in a new junction table `activity_nationality_breakdown`:

### DB migration (add to `021_dynamic_lookups.sql`):
```sql
-- Nationality lookup
INSERT INTO system_configurations (config_type, config_code, config_value, display_order) VALUES
('nationality','SUDANESE','Sudanese',1),
('nationality','CONGOLESE','Congolese (DRC)',2),
('nationality','SOUTH_SUDANESE','South Sudanese',3),
('nationality','SOMALI','Somali',4),
('nationality','RWANDESE','Rwandese',5),
('nationality','UGANDAN','Ugandan (host community)',6),
('nationality','OTHER','Other',99)
ON CONFLICT DO NOTHING;

-- Breakdown table
CREATE TABLE IF NOT EXISTS activity_nationality_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    nationality_id UUID NOT NULL REFERENCES system_configurations(id),
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(activity_id, nationality_id)
);
CREATE INDEX IF NOT EXISTS idx_anb_activity ON activity_nationality_breakdown(activity_id);
```

### Backend
- `GET /api/v1/support-data/nationalities` → list from system_configurations
- On `POST/PUT /activities`: accept `nationality_breakdown: [{nationality_id, count}]` and upsert into `activity_nationality_breakdown`
- On `GET /activities/:id`: JOIN and return `nationality_breakdown` array
- Keep old `nationality_*` columns but mark as deprecated (don't break existing data)

### Frontend — Activity modal
Replace the four static nationality number inputs with a **dynamic section** that:
1. Fetches nationalities from the API on modal open
2. Renders one number input row per nationality
3. Submits as `nationality_breakdown` array

### Frontend — Support Data
Add a **Nationalities** tab in Support Data for CRUD on `system_configurations WHERE config_type = 'nationality'`.

---

## 8. Activity Reporting — show nationality breakdown dynamically

In any activity detail view or report that shows nationality counts:
- Replace references to `nationality_sudanese`, etc. with a loop over `nationality_breakdown` from the API response.
- Show a small table or series of badges: `Sudanese: 12 | Congolese: 8 | ...`

---

## Files to modify (summary)

| File | Changes |
|------|---------|
| `database/migrations/020_location_hierarchy.sql` | New — districts, settlements |
| `database/migrations/021_dynamic_lookups.sql` | New — age groups, nationalities, breakdown table |
| `src/server/routes/activities.js` | location→district/settlement, nationality_breakdown |
| `src/server/routes/cases.js` | remove case_source |
| `src/server/routes/supportData.js` | new endpoints for districts, settlements, age-groups, nationalities |
| `public/js/supportData.js` | Add Locations, Age Groups, Nationalities management tabs; fix role case check |
| Activity modal JS (find exact file) | cascade location, remove thematic area, dynamic nationality, project context |
| Case modal JS (find exact file) | remove case_source, dynamic age groups |
| `public/js/renderProjectDashboard.js` | Pass projectId to activity modal, filter indicators |

## Important constraints
- All new `system_configurations` inserts must use `ON CONFLICT DO NOTHING`
- Keep old DB columns (`location`, `nationality_*`) — do not drop them
- Role checks must compare lowercase: `role?.toLowerCase() === 'admin'`
- All new API endpoints must require authentication (`requireAuth` middleware)
