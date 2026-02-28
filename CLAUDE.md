# SymptomSync Claude Guide

## Repository shape

- `web/`: Next.js 16 pages-router frontend with large page files, Supabase client access, charts, calendar flows, uploads, and a Gemini-powered chat UI.
- `supabase/` and `database/`: SQL schema and migration surface for the hosted data model. These directories overlap and must stay aligned.
- `agentic_ai/`: Python 3.11 FastAPI/LangGraph service for symptom analysis, metrics, and a pseudo-MCP API surface.
- `aws/`, `ansible/`, `jenkins/`, `devops/`, `.github/workflows/`: optional self-hosted infrastructure, delivery, monitoring, and security automation.

## Global working rules

- Treat code as the source of truth when README or design docs disagree with implementation.
- Prefer surgical edits. Several frontend pages are very large; avoid broad rewrites unless the task explicitly calls for them.
- If a data contract changes, trace all affected surfaces: SQL, frontend `web/lib/*`, page usage, AI flows, tests, docs, and deployment/config if applicable.
- If deployment behavior changes, update the operational docs in the same change when they become stale.
- Check for a more specific `CLAUDE.md` in the directory you are editing before making assumptions.

## Validation defaults

- Frontend: run `npm run lint` and `npm run build` in `web/`.
- Agentic AI: run `make lint` and `make test` in `agentic_ai/`.
- AWS/CDK: if dependencies are available, prefer `npx cdk synth` in `aws/`; otherwise explain what could not be verified.
- SQL-only changes: inspect all consumers in `web/lib/`, relevant pages, and any mirrored files under `database/`.
- Pipeline or deploy changes: read `.github/workflows/ci.yml`, `jenkins/Jenkinsfile`, and the relevant runbooks together.

## Known repo landmines

- `web/package.json` defines `npm test` as `next dev`; it is not an authoritative test command.
- `web/jest.config.js` points at `ts-jest` and `jest.setup.ts`, but the repo does not currently contain a complete, wired frontend Jest toolchain. Do not assume frontend tests are runnable unless you are fixing that setup.
- `supabase/` and `database/` are overlapping SQL sources. Schema edits that land in one but not the other are likely wrong.
- `agentic_ai/README.md` is more ambitious than the current code in places. Verify routes, settings, and graph behavior directly in code before promising capabilities.
- `aws/lambda/chatbotHandler.js` still contains placeholder Vertex AI project information.

## Project extensions to use

- Skills: `/symptomsync-web-change`, `/symptomsync-data-change`, `/symptomsync-agentic-ai-change`, `/symptomsync-release-change`, `/symptomsync-review`
- Subagents: `frontend-specialist`, `supabase-data-specialist`, `agentic-ai-specialist`, `release-safety-reviewer`

## Useful internal references

- `.claude/references/repo-surface-map.md`
- `.claude/references/validation-matrix.md`
- `.claude/references/data-contract-checklist.md`
- `.claude/references/release-safety-checklist.md`
