---
name: symptomsync-data-change
description: Guide for changing SymptomSync SQL, schema contracts, and reminder plumbing safely. Use when tasks touch supabase/, database/, database/migrations/, SQL functions, cron/reminder logic, user_notifications behavior, mirrored schema maintenance, or frontend code that depends on those contracts.
---

# SymptomSync Data Change

Use this skill when the task changes the data model or reminder behavior.

## Workflow

1. Read `supabase/AGENTS.md` or `database/AGENTS.md` depending on the edit target.
2. Search both `supabase/` and `database/` for the object you plan to change.
3. Search `web/lib/` and `web/pages/` for affected table names and column names.
4. Apply the SQL change in every repository copy that should remain aligned.
5. Update TypeScript schemas, helper payloads, and UI assumptions that consume the changed fields.

## High-risk areas

- `notify_due_reminders.sql`
- `cron.sql`
- `medication_reminders`
- `appointment_reminders`
- `user_notifications`
- mirrored files under `database/migrations/`

Read `references/data-contract-checklist.md` when you need the contract and mirror checklist.

## Validation

1. Compare the `supabase/` and `database/` copies for the changed object.
2. Re-read affected `web/lib/*` helpers for create, update, and select breakage.
3. Run frontend validation commands if user-visible flows depend on the changed data.
4. Update docs only when external behavior or operator workflow changed.

## Guardrails

- Trust checked-in SQL over prose docs when schedules or column details differ.
- Preserve `user_profile_id` ownership semantics unless the task explicitly changes them.
- Avoid one-sided edits that update only `supabase/` or only `database/`.
- Treat frontend Zod schemas as part of the contract.

## Related skills

- Use `$symptomsync-web-change` when the data change affects rendered UI or form payloads.
- Use `$symptomsync-doc-sync` when architecture or operator docs became stale.
