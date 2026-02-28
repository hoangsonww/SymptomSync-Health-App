# Repo Surface Map

## Product and data surfaces

- `web/`: user-facing product. Key high-change pages are `home.tsx`, `chat.tsx`, `calendar.tsx`, `reminder.tsx`, `uploads.tsx`, and `profile.tsx`.
- `web/lib/`: typed client-side data contract layer over Supabase and local helpers such as `aiChat.ts`, `files.ts`, `profile.ts`, `medications.ts`, `appointmentReminders.ts`, and `healthLogs.ts`.
- `supabase/`: hosted SQL definitions, cron function, notification function, and triggers.
- `database/` and `database/migrations/`: mirrored SQL/migration copies that should stay consistent with `supabase/`.

## AI and service surfaces

- `agentic_ai/mcp_server/`: FastAPI app, routes, models, and metrics endpoint.
- `agentic_ai/graphs/` and `agentic_ai/agents/`: LangGraph state machine and specialized analysis agents.
- `agentic_ai/config/settings.py`: env-driven runtime config using `SYMPTOMSYNC_` names.

## Delivery surfaces

- `aws/`: CDK stack plus Lambda handlers for the self-hosted/serverless path.
- `ansible/`: blue/green cutover automation against SSM.
- `jenkins/`: CI/CD pipeline with canary deployment and promotion stages.
- `.github/workflows/ci.yml`: GitHub Actions pipeline for linting, testing, building, scanning, and deployment.
- `devops/`: security, monitoring, cost, terraform, and runbook documentation.

## Key docs worth checking when behavior changes

- `README.md`
- `ARCHITECTURE.md`
- `DEPLOYMENTS.md`
- `devops/runbooks/progressive-delivery.md`
- `devops/runbooks/production-readiness.md`
