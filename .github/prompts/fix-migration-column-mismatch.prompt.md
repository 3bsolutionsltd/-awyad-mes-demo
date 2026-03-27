---
mode: agent
description: Fix a failing SQL migration where a column, trigger, or index referenced in the migration does not exist or conflicts with an earlier migration's schema.
---

# Fix Migration Column/Schema Mismatch

## Context

This project has a layered migration system where `database/migrate.js` runs `database/schema.sql` first, then numbered migrations from `database/migrations/` in order. A recurring problem is that later migrations reference columns, indexes, or triggers that:
- Were created by an **earlier migration** with **different names** (e.g., migration 007 created `system_configurations` with `config_category`/`code`/`name`, but migration 008 expects `config_type`/`config_code`/`config_value`)
- Were defined in `schema.sql` without optional columns that a later migration tries to INSERT into (e.g., `roles.permissions JSONB`)
- Are **NOT NULL** in the base schema but the migration omits them from INSERT (e.g., `roles.display_name`)
- Are duplicate `CREATE TRIGGER` or `CREATE INDEX` without `IF NOT EXISTS`

## Task

I have a failing migration. Fix it so it runs cleanly without dropping or recreating any existing data.

**Error message:**
```
${input:error_message:Paste the full migration error here, e.g. "column X of relation Y does not exist"}
```

**Failing migration file:** `database/migrations/${input:migration_file:e.g. 009_enhanced_roles.sql}`

## Steps to Follow

1. **Read the failing migration file** to see what columns/triggers/indexes it references.
2. **Read `database/schema.sql`** to see the base table definitions (column names, NOT NULL constraints).
3. **Read the migrations that ran before this one** (lower numbers) to see if any of them created/altered the same tables with different column names.
4. **Apply one or more of these fixes at the top of the failing migration**, before the first INSERT/UPDATE:

   - **Missing column:** `ALTER TABLE <t> ADD COLUMN IF NOT EXISTS <col> <type>;`
   - **NOT NULL violation (column exists but INSERT omits it):** `ALTER TABLE <t> ALTER COLUMN <col> DROP NOT NULL;`
   - **Duplicate trigger:** `DROP TRIGGER IF EXISTS <trigger_name> ON <table>;` before `CREATE TRIGGER`
   - **Duplicate index:** Change `CREATE INDEX` → `CREATE INDEX IF NOT EXISTS`
   - **Wrong conflict target:** Change `ON CONFLICT (col_a, col_b)` → `ON CONFLICT DO NOTHING` when the UNIQUE constraint doesn't match the actual schema

5. **Do not** rewrite the migration logic — only add guards at the top. Do not change INSERT column lists unless strictly necessary.

6. After fixing, confirm there are no other bare `CREATE INDEX` or `CREATE TRIGGER` statements in the same file.

## Output

Apply the fix directly to `database/migrations/${input:migration_file}`. Then output:
- What was wrong (one sentence)
- What was added to fix it (the exact SQL lines added)
- The git commit command to use
