---
title: Fix "Failed to create activity: \"project_id\" must be a string" and default Planned Date
description: |
  A focused prompt to guide the developer/agent to fix the activity-creation bug where `project_id` is passed as a non-string and to ensure planned dates validation and defaulting.
  - Ensure `project_id` is validated/cast to a string before creating an Activity.
  - Ensure planned dates are within the Activity's `Planned Date` range.
  - Default the Activity `Planned Date` to the Project `start_date` (user-editable) when creating a new Activity.
scope: workspace
applyTo:
  - "**/src/**"
  - "**/public/**"
  - "**/database/**"
  - "**/app.js"
tags:
  - bugfix
  - validation
  - ux
---

Context
-------
- Repo: AWYAD MES (Node.js backend + public frontend)
- Symptom: "Failed to create activity: \"project_id\" must be a string"
- Example URL where user hit the error: https://awyad.3bs.ltd/index.html#project-dashboard?id=fbf1099d-25bf-442f-b56c-6716102ec04f

Goal
----
1. Fix the API/frontend so creating an Activity no longer throws the `project_id` type error.
2. When creating a new Activity, set its `Planned Date` default to the Project `start_date` (but allow the user to change it in the UI).
3. Validate that any planned dates given for the activity fall within the `Planned Date` range (or the project's allowed range) and reject/save with clear error messages.

Assumptions & placeholders
--------------------------
- Field names may vary between code paths. If your code uses different names, replace these placeholders:
  - `project_id` (API payload field)
  - `plannedDate` / `planned_start` / `planned_end` (activity planned dates)
  - `project.start_date` or `projectPlannedDate` (project's start date)
- Backend likely in `src/` or top-level `app.js`; frontend forms in `public/` or `components/`.

Step-by-step Fix Checklist (what the agent/dev should do)
---------------------------------------------------------
1. Find the activity creation endpoint (server route) and the frontend call that sends activity payloads.
2. Add defensive validation on the server side:
   - Validate `project_id` exists and is a string. If not, try to coerce: `String(project_id)` or reject with 400 and clear message.
   - Validate planned date fields are present and are valid ISO dates.
   - Ensure the planned dates fall within the project's planned range (or at least that planned_date >= project.start_date and <= project.end_date if available).
3. In the create-activity flow, when no `plannedDate` is provided by the user, set it to `project.start_date` on the server (or compute it on the frontend before sending). Keep it editable in the UI.
4. Add clear error handling on the frontend to surface validation errors returned by the API (e.g., show "Planned date must be on or after project start date").
5. Add or update unit/integration tests that cover:
   - `project_id` as number or UUID -> API coerces/accepts string
   - planned date defaulting to project start date
   - rejection when planned dates are outside allowed range

Suggested code snippets
-----------------------
Node/Express (server-side validation example):

```js
// Example inside POST /activities handler
const { project_id, plannedDate } = req.body;
if (project_id == null) return res.status(400).json({ error: 'project_id is required' });
const pid = String(project_id);
// lookup project
const project = await db.getProjectById(pid);
if (!project) return res.status(400).json({ error: 'project not found' });
const projectStart = project.start_date && new Date(project.start_date);
let finalPlannedDate = plannedDate ? new Date(plannedDate) : projectStart;
if (!finalPlannedDate || isNaN(finalPlannedDate)) return res.status(400).json({ error: 'invalid plannedDate' });
if (projectStart && finalPlannedDate < projectStart) {
  return res.status(400).json({ error: 'Planned date must be on or after project start date' });
}
// proceed to create activity with pid and finalPlannedDate.toISOString()
```

Frontend (set default before sending):

```js
// When opening the create-activity modal
async function openCreateActivity(projectId) {
  const project = await fetch(`/api/projects/${projectId}`).then(r=>r.json());
  const defaultPlannedDate = project.start_date || new Date().toISOString().slice(0,10);
  // populate form planned date input with defaultPlannedDate
}
```

What to ask the user if unclear
-------------------------------
- Where is the activity creation endpoint? (file path or route name)
- What are the exact field names used by the API and the frontend for `planned date` and `project start date`?

Example invocations for this prompt
----------------------------------
- "Fix activity creation bug for project_id type and default planned date"
- "Ensure planned dates validation and defaulting to project start date for Activities"

Notes
-----
- Prefer server-side validation as primary defense; frontend validation is UX only.
- If `project_id` is used as a numeric DB id anywhere, ensure conversion to string only for API-facing fields and maintain DB type where needed.

After you run the fix
---------------------
- Test creating an activity via the UI and via an API client (Postman/curl) using `project_id` as a string and as a number/UUID to confirm both pass.
- Confirm the default Planned Date is pre-filled with the project's start date in the create form and remains editable.
