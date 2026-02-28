---
name: symptomsync-web-change
description: Use when tasks touch the Next.js frontend in web/, including pages-router pages, React components, Supabase client flows, Gemini chat UX, charts, calendar behavior, uploads, auth screens, or frontend-facing API routes. Especially relevant for home.tsx, chat.tsx, calendar.tsx, reminder.tsx, uploads.tsx, profile.tsx, auth pages, lib/*.ts, and pages/api/med.ts.
---

# SymptomSync Web Change

Use this skill for implementation or investigation in `web/`.

## Start here

1. Read `web/CLAUDE.md`.
2. Identify the smallest affected slice: page, component, utility, or data helper.
3. Trace the data path before editing:
   - page/component
   - `web/lib/*`
   - Supabase schema or external API dependency if applicable

## Frontend realities

- This is a pages-router app. Keep that architecture unless explicitly asked to migrate it.
- Several page files are very large. Prefer local refactors and helper extraction only when they clearly reduce risk.
- `web/lib/supabaseClient.ts` is the client singleton.
- `web/lib/aiChat.ts` and `web/pages/chat.tsx` form a coupled flow. Change them together when action-block parsing or model behavior changes.
- Realtime reminders, uploads, and profile flows are tightly coupled to SQL shape.

## Required checks before finishing

1. Run `npm run lint` in `web/`.
2. Run `npm run build` in `web/`.
3. If you changed data fields or payloads, inspect matching Zod schemas and create/update helpers in `web/lib/`.
4. If you changed `pages/api/med.ts`, inspect `web/__tests__/api-med.spec.js`.

## Do not make these assumptions

- Do not treat `npm test` as a real validation step here.
- Do not assume the Jest setup is healthy without inspecting `package.json`, `jest.config.js`, and the missing `jest.setup.ts`.
- Do not change frontend data contracts without checking `supabase/` and `database/`.

## Use related assets when helpful

- Open `.claude/references/repo-surface-map.md` for file routing.
- Open `.claude/references/validation-matrix.md` for command guidance.
- Open `.claude/references/data-contract-checklist.md` when a frontend change depends on schema shape.

## Delegate when useful

- Use `frontend-specialist` for focused implementation or debugging in `web/`.
- Use `supabase-data-specialist` when frontend work depends on schema, reminders, or mirrored SQL.
