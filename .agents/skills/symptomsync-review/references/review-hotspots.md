# Review Hotspots

## Web

- `web/package.json` uses `next dev` for `npm test`.
- Large pages can hide duplicated logic and partial state updates.
- Data-shape changes usually require updates in `web/lib/*` and page-level consumers.

## Data

- `supabase/` and `database/` must stay aligned.
- Reminder behavior depends on both `notify_due_reminders.sql` and `cron.sql`.

## Agentic AI

- Verify service behavior in code, not just in `agentic_ai/README.md`.
- Settings use the `SYMPTOMSYNC_` env prefix.

## Release

- Blue/green promotion depends on `/health` and `/symptomsync/active_stage`.
- Jenkins and GitHub Actions can drift if only one pipeline is updated.
