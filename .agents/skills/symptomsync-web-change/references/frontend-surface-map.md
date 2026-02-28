# Frontend Surface Map

## High-change pages

- `pages/home.tsx`: dashboard, charts, medication reminders, appointment reminders, health logs, barcode-assisted medication entry
- `pages/chat.tsx`: Gemini chat UI plus action extraction and client-side CRUD delegation
- `pages/calendar.tsx`: calendar view plus ICS import and export logic
- `pages/reminder.tsx`: reminder-focused management UI
- `pages/uploads.tsx`: document upload, search, edit, export flows
- `pages/profile.tsx`: profile editing and avatar upload

## Core helpers

- `lib/supabaseClient.ts`: singleton client
- `lib/medications.ts`
- `lib/appointmentReminders.ts`
- `lib/healthLogs.ts`
- `lib/files.ts`
- `lib/profile.ts`
- `lib/aiChat.ts`

## Repo-specific caveats

- `package.json` uses `next dev` for `npm test`.
- `jest.config.js` references `ts-jest` and `jest.setup.ts`, but the repo does not contain a complete frontend Jest setup.
- Many user-facing flows depend on SQL shape and RLS behavior even though those rules live outside the frontend code.
