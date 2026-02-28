# Validation Matrix

## Frontend (`web/`)

- Primary commands:
  - `npm run lint`
  - `npm run build`
- Caveats:
  - `npm test` currently runs `next dev`.
  - `jest.config.js` references `ts-jest` and `jest.setup.ts`, but the repository does not contain a complete frontend Jest setup.

## Agentic AI (`agentic_ai/`)

- Primary commands:
  - `make lint`
  - `make test`
- Secondary focused commands:
  - `pytest tests/ -v`
  - `uvicorn mcp_server.server:app --reload --host 0.0.0.0 --port 8000`

## AWS / deployment (`aws/`, `ansible/`, `jenkins/`)

- Primary commands:
  - `npx cdk synth` in `aws/` when dependencies are available
  - read `ansible/blue-green-rollout.yml` and runbooks together for rollout logic
- Caveats:
  - deployment scripts depend on cloud credentials and environment secrets
  - release correctness is partly documentary: runbooks and pipeline docs must remain accurate

## SQL / data model (`supabase/`, `database/`)

- There is no single canonical command in-repo.
- Required validation is change impact analysis:
  - search matching SQL object names in both directories
  - search frontend consumers in `web/lib/` and `web/pages/`
  - inspect reminder or notification flows when schedule-related fields change
