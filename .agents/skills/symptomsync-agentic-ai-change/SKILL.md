---
name: symptomsync-agentic-ai-change
description: Guide for changing SymptomSync's Python symptom-analysis service under agentic_ai/. Use when tasks touch the FastAPI service, LangGraph flow, agents, chains, settings, tests, monitoring, or deployment configuration for the agentic_ai workspace.
---

# SymptomSync Agentic AI Change

Use this skill when the task is primarily in `agentic_ai/`.

## Workflow

1. Read `agentic_ai/AGENTS.md`.
2. Classify the task:
   - API surface
   - graph or state logic
   - agent behavior
   - runtime settings
   - observability or deployment behavior
3. Trace the smallest set of files that share the contract before editing.
4. Verify behavior from code rather than relying on README claims.

## Important repo truths

- The checked-in service is a FastAPI app with `/health`, `/metrics`, and `/api/v1` routes.
- Settings live in `config/settings.py` and use the `SYMPTOMSYNC_` env prefix.
- Route or model changes usually require touching `mcp_server/models.py`, `mcp_server/routes.py`, and tests together.
- Monitoring behavior is part of the contract, not optional polish.

Read `references/service-map.md` when you need the main service hotspots.

## Validation

1. Run `make lint` in `agentic_ai/`.
2. Run `make test` in `agentic_ai/`.
3. If only a subset is relevant, inspect the matching tests even if full execution is not possible.

## Guardrails

- Do not advertise true MCP protocol behavior unless the current code actually implements it.
- Keep request and response shapes synchronized across models, routes, and tests.
- Be careful with env variable names; the settings object expects `SYMPTOMSYNC_` prefixes.

## Related skills

- Use `$symptomsync-release-change` when service changes also affect deployment or runtime config.
- Use `$symptomsync-doc-sync` when service docs or operational docs need updating.
