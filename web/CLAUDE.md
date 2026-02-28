# Frontend Notes

- This is a Next.js pages-router app, not an app-router codebase. Do not migrate routing architecture unless explicitly asked.
- The highest-risk files are `pages/home.tsx`, `pages/chat.tsx`, `pages/calendar.tsx`, `pages/reminder.tsx`, `pages/uploads.tsx`, and `pages/profile.tsx`. Make narrowly scoped edits and search for duplicate logic before adding more.
- Data access lives mostly in `lib/*.ts` and uses the singleton Supabase client from `lib/supabaseClient.ts`.
- Environment variables used directly in the frontend include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_GOOGLE_AI_API_KEY`.
- `lib/aiChat.ts` calls the Google Generative AI SDK directly from the frontend surface; if you change request or response structure, audit `pages/chat.tsx` together with it.
- Realtime, reminders, uploads, and profile flows depend on SQL shape and RLS assumptions. Frontend edits often require checking `supabase/` and `database/`.

## Validation

- Primary checks: `npm run lint` and `npm run build`.
- Do not use `npm test` as evidence of correctness here.
- If you touch `pages/api/med.ts`, inspect `web/__tests__/api-med.spec.js` even if the local Jest toolchain is incomplete.

## Change discipline

- Preserve existing UX patterns unless the task is explicitly visual redesign.
- Keep browser-only workarounds such as client-only rendering in place unless you have verified the hydration path end-to-end.
- When adding fields to forms or records, update matching Zod schemas and all create/update flows in `lib/`.
