---
description: "Make the LOP Target field optional in Add/Edit Indicator forms (remove required attribute and asterisk label). Use when: lop_target should not be mandatory, fixing validation on indicator forms."
agent: agent
---

# Make LOP Target Optional in Indicator Forms

The `lop_target` (LOP Target) field is currently marked as mandatory (`required`) in the indicator forms but it should be optional. The backend Joi schema already treats it as optional — only the frontend needs updating.

## Context Files

Read these files before making changes:

- [public/js/indicatorForms.js](../../public/js/indicatorForms.js) — HTML templates for indicator forms (search for `lop_target` and `piLopTarget`)
- [src/server/routes/indicators.js](../../src/server/routes/indicators.js) — Joi schemas (verify `lop_target` is already optional — no change needed if `.default(0)` is present)

## Changes Required

### 1. Project Indicator form (`#piLopTarget` — Add Project Indicator modal)

Find the label + input block for LOP Target in the project indicator form. Make these two changes:

**Label** — remove the red asterisk `<span>`:
```html
<!-- BEFORE -->
<label for="piLopTarget" class="form-label">LOP Target <span class="text-danger">*</span></label>

<!-- AFTER -->
<label for="piLopTarget" class="form-label">LOP Target</label>
```

**Input** — remove the `required` attribute:
```html
<!-- BEFORE -->
<input type="number" class="form-control" id="piLopTarget" name="lop_target" required min="0" step="0.01" value="0">

<!-- AFTER -->
<input type="number" class="form-control" id="piLopTarget" name="lop_target" min="0" step="0.01" value="0">
```

### 2. Standalone Indicator form (`#indicatorLopTarget` — Add Indicator modal)

Find the input with `id="indicatorLopTarget"` and remove `required` there too for consistency:

```html
<!-- BEFORE -->
<input type="number" class="form-control" id="indicatorLopTarget" name="lop_target" required min="0" step="0.01" value="0">

<!-- AFTER -->
<input type="number" class="form-control" id="indicatorLopTarget" name="lop_target" min="0" step="0.01" value="0">
```

If this input also has a label with `<span class="text-danger">*</span>`, remove that asterisk too.

### 3. Backend — verify no change needed

Confirm `src/server/routes/indicators.js` Joi schema has:
```js
lop_target: Joi.number().min(0).default(0),  // no .required() — already optional
```
If it already looks like this, no backend change is needed.

## Constraints

- Do **not** change any other field's required/optional state.
- Do **not** add a placeholder or hint text unless explicitly asked.
- The field should still default to `0` when left blank so existing save/submit logic is unaffected.
