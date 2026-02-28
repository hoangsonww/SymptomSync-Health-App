---
name: symptomsync-data-change
description: Use when tasks change the data model or reminder plumbing in supabase/, database/, database/migrations/, or frontend code that depends on those contracts. This includes schema edits, SQL functions, cron/reminder logic, user_notifications behavior, mirrored SQL maintenance, and any work that changes fields consumed by web/lib or large frontend pages.
---

# SymptomSync Data Change

Use this skill when the task affects SQL, data contracts, or reminder behavior.

## Workflow

1. Read `supabase/CLAUDE.md` or `database/CLAUDE.md` depending on the edit target.
2. Search both `supabase/` and `database/` for the object you plan to change.
3. Search `web/lib/` and `web/pages/` for all affected table names and column names.
4. Make the SQL change in every repository copy that should remain aligned.
5. Update TypeScript schemas, query helpers, and UI assumptions that consume the changed data.

## High-risk areas

- `notify_due_reminders.sql`
- `cron.sql`
- `medication_reminders` and `appointment_reminders`
- `user_notifications`
- mirrored migration files under `database/migrations/`

## Guardrails

- Trust the checked-in SQL over prose docs when schedules or column details differ.
- Preserve ownership semantics around `user_profile_id` unless the task explicitly changes them.
- Avoid one-sided edits that update only `supabase/` or only `database/`.
- Treat frontend Zod schemas as part of the contract, not optional polish.

## Before finishing

1. Compare the `supabase/` and `database/` copies for the changed object.
2. Re-read affected `web/lib/*` helpers for create/update/select breakage.
3. Run the frontend validation commands if user-visible flows depend on the changed data.
4. Update docs only when the external behavior or operator workflow actually changed.

## Use related assets when helpful

- `.claude/references/data-contract-checklist.md`
- `.claude/references/validation-matrix.md`
- `.claude/references/repo-surface-map.md`

## Delegate when useful

- Use `supabase-data-specialist` for schema tracing, mirror checks, and reminder-flow auditing.
- Pair with `frontend-specialist` when the SQL change affects rendered UI or form payloads.
