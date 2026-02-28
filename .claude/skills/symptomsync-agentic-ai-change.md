---
name: symptomsync-agentic-ai-change
description: Use when tasks touch agentic_ai/, including the FastAPI service, LangGraph flow, agents, chains, settings, tests, monitoring, or deployment config for the symptom-analysis pipeline. Especially relevant for mcp_server/server.py, mcp_server/routes.py, graphs/, agents/, config/settings.py, and the Python test suite.
---

# SymptomSync Agentic AI Change

Use this skill for Python service work in `agentic_ai/`.

## Workflow

1. Read `agentic_ai/CLAUDE.md`.
2. Identify whether the task changes:
   - API surface
   - graph or state logic
   - agent behavior
   - runtime settings
   - observability or deployment behavior
3. Trace the smallest set of files that share the contract before editing.
4. Verify code behavior directly instead of trusting README claims.

## Important repo truths

- The service is implemented as a FastAPI app with metrics and `/api/v1` routes.
- Settings live in `config/settings.py` and use the `SYMPTOMSYNC_` env prefix.
- Route or model changes often require touching `mcp_server/models.py`, `mcp_server/routes.py`, and tests together.
- Monitoring and health behavior are part of the contract, not optional extras.

## Validation

1. Run `make lint` in `agentic_ai/`.
2. Run `make test` in `agentic_ai/`.
3. If only part of the suite is relevant, inspect the matching tests even if full execution is not possible.

## Guardrails

- Do not advertise true MCP protocol behavior unless the current code actually implements it.
- Keep request/response shapes synchronized across models, routes, and tests.
- Be careful with environment variable names: the checked-in settings object expects `SYMPTOMSYNC_` prefixes.

## Use related assets when helpful

- `.claude/references/repo-surface-map.md`
- `.claude/references/validation-matrix.md`

## Delegate when useful

- Use `agentic-ai-specialist` for focused work in `agentic_ai/`.
- Pair with `release-safety-reviewer` if the change also affects deployment, ports, or runtime env vars.
