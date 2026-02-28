# Database Mirror Notes

- Treat `database/` as a mirror surface for the hosted SQL model under `supabase/`.
- When changing schema or functions here, inspect the corresponding file under `supabase/` and keep the repository-consumed copies aligned.
- Files under `database/migrations/` are especially important for migration-style updates; do not update only the top-level SQL file if the migration copy also needs it.
- Frontend code assumes stable shapes for reminders, health logs, files, and profiles through `web/lib/*.ts` Zod schemas and query helpers.

## Validation

- Search both `database/` and `supabase/` for the same object name before and after edits.
- Search `web/lib/` and `web/pages/` for affected column names or table names.
