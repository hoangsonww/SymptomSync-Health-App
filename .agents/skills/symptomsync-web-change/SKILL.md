---
name: symptomsync-web-change
description: Guide for making safe, repo-specific changes in SymptomSync's Next.js frontend under web/. Use when tasks touch pages-router pages, React components, Supabase client flows, Gemini chat UX, charts, calendar behavior, uploads, auth screens, or frontend-facing API routes such as pages/api/med.ts.
---

# SymptomSync Web Change

Use this skill when the task is primarily in `web/`.

## Workflow

1. Read `web/AGENTS.md`.
2. Identify the smallest affected slice: page, component, utility, or data helper.
3. Trace the flow before editing:
   - page or component
   - `web/lib/*`
   - SQL contract or external API dependency if the UI relies on one
4. Keep the change local unless the task explicitly asks for a refactor.

## What to verify

- This is a pages-router app, not an app-router app.
- `lib/supabaseClient.ts` is the singleton Supabase client.
- `lib/aiChat.ts` and `pages/chat.tsx` are tightly coupled.
- Realtime reminders, uploads, and profile flows depend on SQL shape.

Read `references/frontend-surface-map.md` when you need the main page and helper hotspots.

## Validation

1. Run `npm run lint` in `web/`.
2. Run `npm run build` in `web/`.
3. If you changed form fields or data payloads, inspect matching Zod schemas and helpers in `web/lib/`.
4. If you changed `pages/api/med.ts`, inspect `web/__tests__/api-med.spec.js`.

## Guardrails

- Do not rely on `npm test`; in this repo it runs `next dev`.
- Do not assume frontend Jest is fully wired without checking the checked-in config and files.
- Do not change frontend data contracts without checking the matching SQL surfaces.

## Related skills

- Use `$symptomsync-data-change` when the frontend task depends on SQL changes.
- Use `$symptomsync-doc-sync` when user-facing docs must change with the code.
