# Data Contract Checklist

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
3. Search `web/lib/` for Zod schemas, query helpers, and create or update payloads that reference the changed columns.
4. Search `web/pages/` for direct field usage, rendering, filters, exports, and action handling.
5. Check reminder-related functions if the schedule or notification semantics changed.

## Special cautions

- Reminder cadence in prose docs can drift from SQL. Trust `cron.sql`.
- Frontend helpers usually parse returned rows with Zod. Schema changes often require TypeScript updates even when the UI looks unaffected.
