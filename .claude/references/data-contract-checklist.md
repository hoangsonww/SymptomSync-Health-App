# Data Contract Checklist

Use this when changing SQL, Supabase client code, or reminder/data flows.

## Core entities

- `user_profiles`
- `medication_reminders`
- `appointment_reminders`
- `health_logs`
- `files`
- `user_notifications`

## Required follow-through

1. Update the SQL definition in `supabase/`.
2. Update the mirrored copy in `database/` and `database/migrations/` when applicable.
3. Search `web/lib/` for Zod schemas, query helpers, and create/update payloads that reference the changed columns.
4. Search `web/pages/` for direct field usage, rendering, filters, exports, and action handling.
5. Check reminder-related functions:
   - `supabase/notify_due_reminders.sql`
   - `supabase/cron.sql`
   - any mirrored files under `database/`
6. Update docs only when the behavior exposed to users or operators actually changed.

## Special cautions

- Reminder cadence in prose docs can drift from SQL. Trust `cron.sql`.
- Frontend helpers usually parse returned rows with Zod. Schema changes often require TypeScript changes even when the UI looks unaffected.
- RLS is described in docs but not fully expressed in these checked-in SQL files. Avoid inventing policy assumptions without verifying the live or documented contract.
