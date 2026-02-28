# SymptomSync Codex Guide

## Repository shape

- `web/`: Next.js 16 pages-router frontend with Supabase-backed product flows, large page components, uploads, reminders, calendar, and Gemini chat.
- `supabase/` and `database/`: overlapping SQL surfaces for schema, functions, cron, and migration copies. Keep them aligned.
- `agentic_ai/`: Python 3.11 FastAPI/LangGraph service for symptom analysis, metrics, and a pseudo-MCP API surface.
- `aws/`, `ansible/`, `jenkins/`, `.github/workflows/`, `devops/`: deployment, rollout, CI/CD, monitoring, and security automation.

## Default expectations

- Treat implementation as the source of truth when docs drift.
- Prefer surgical edits. Several frontend pages are large and fragile.
- If a data contract changes, trace the impact across SQL, `web/lib/*`, consuming pages, tests, and docs.
- If deployment behavior changes, update the matching pipeline and runbook docs in the same task.
- Check for a deeper `AGENTS.md` in the directory you are editing before you finalize a plan.

## Validation defaults

- Frontend: run `npm run lint` and `npm run build` in `web/`.
- Agentic AI: run `make lint` and `make test` in `agentic_ai/`.
- AWS/CDK: prefer `npx cdk synth` in `aws/` when dependencies are present.
- SQL-only tasks: inspect all affected consumers in `web/lib/`, `web/pages/`, and mirrored files under `database/`.
- Pipeline or deploy tasks: read `.github/workflows/ci.yml`, `jenkins/Jenkinsfile`, and the relevant runbooks together.

## Known repo landmines

- `web/package.json` defines `npm test` as `next dev`; do not treat it as a real test command.
- `web/jest.config.js` references `ts-jest` and `jest.setup.ts`, but the frontend Jest setup is incomplete in the checked-in repo.
- `supabase/` and `database/` overlap. One-sided SQL edits are usually wrong.
- `agentic_ai/README.md` describes more than the current code reliably implements. Verify behavior in code.
- `aws/lambda/chatbotHandler.js` still contains placeholder Vertex AI project configuration.

## Repo skills

- `$symptomsync-web-change`: frontend changes in `web/`
- `$symptomsync-data-change`: SQL and schema-contract changes
- `$symptomsync-agentic-ai-change`: Python AI service work
- `$symptomsync-release-change`: infra, CI/CD, deployment, and rollout work
- `$symptomsync-review`: repo-specific review workflow
- `$symptomsync-doc-sync`: keep code-facing docs aligned with implementation

## Repo rules

- Repo exec-policy rules live under `codex/rules/`.
- High-risk deploy and traffic-shift commands should prompt rather than run implicitly.
