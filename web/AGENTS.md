# Frontend Notes

- This is a Next.js pages-router app, not an app-router codebase.
- Highest-risk files include `pages/home.tsx`, `pages/chat.tsx`, `pages/calendar.tsx`, `pages/reminder.tsx`, `pages/uploads.tsx`, and `pages/profile.tsx`. Prefer narrow changes.
- Data access is mostly through `lib/*.ts` and the singleton client in `lib/supabaseClient.ts`.
- `lib/aiChat.ts` and `pages/chat.tsx` are tightly coupled. Change them together when action parsing or model behavior changes.
- Realtime reminders, uploads, and profile flows depend on SQL shape and RLS assumptions.

## Validation

- Run `npm run lint`.
- Run `npm run build`.
- Do not use `npm test` as evidence of correctness here.

## Skills

- Use `$symptomsync-web-change` for implementation or debugging.
- Use `$symptomsync-data-change` when a frontend change depends on SQL shape.
- Use `$symptomsync-doc-sync` when docs must change with UI behavior.
