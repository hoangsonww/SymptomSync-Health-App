# Database Mirror Notes

- Treat `database/` as a mirror surface for the hosted SQL model under `supabase/`.
- When changing schema or functions here, inspect the corresponding files under `supabase/`.
- Files under `database/migrations/` matter for migration-style changes; do not update only the top-level SQL copy.
- Frontend code assumes stable shapes via `web/lib/*.ts` Zod schemas and helper functions.

## Skills

- Use `$symptomsync-data-change` for schema and contract work.
