# Supabase Notes

- `supabase/` is one of two active SQL surfaces. Mirror relevant changes into `database/` and `database/migrations/`.
- Core contracts include `user_profiles`, `medication_reminders`, `appointment_reminders`, `health_logs`, `files`, and `user_notifications`.
- Reminder behavior depends on both `notify_due_reminders.sql` and `cron.sql`.
- Preserve `user_profile_id` ownership semantics unless the task explicitly changes them.

## Before finishing

- Search `database/` for the same object and keep copies aligned.
- Search `web/lib/` and `web/pages/` for affected table names and columns.

## Skills

- Use `$symptomsync-data-change` for schema or function edits.
- Use `$symptomsync-doc-sync` if the user-visible or operator-visible behavior changed.
