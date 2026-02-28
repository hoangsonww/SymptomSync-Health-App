# Supabase Notes

- `supabase/` is one of two active SQL surfaces. Mirror relevant schema changes into `database/` and `database/migrations/` when the repository expects both copies.
- The core application contract revolves around `user_profiles`, `medication_reminders`, `appointment_reminders`, `health_logs`, `files`, and `user_notifications`.
- Reminder delivery depends on both `notify_due_reminders.sql` and `cron.sql`. The actual schedule in code is every minute; prefer these SQL files over prose docs when they disagree.
- Preserve `user_profile_id` relationships and on-delete behavior unless the task explicitly changes ownership semantics.
- If you change columns, search `web/lib/`, `web/pages/`, and any export/import logic for downstream breakage.

## Before finishing

- Check whether a matching file under `database/` or `database/migrations/` also needs the same change.
- Check whether docs like `README.md`, `ARCHITECTURE.md`, or `DEPLOYMENTS.md` became inaccurate.
