---
name: symptomsync-review
description: Use when reviewing code, plans, or diffs in this repository. Apply it to frontend, SQL, AI-service, infrastructure, and CI/CD changes so review comments reflect this repo's real failure modes: mirrored SQL drift, weak frontend test wiring, doc-vs-code mismatches, env/config regressions, and unsafe release changes.
---

# SymptomSync Review

Use this skill when the task is review-oriented rather than feature implementation.

## Review priorities

1. Data-contract correctness
2. User-visible regression risk
3. Build, lint, or deploy breakage
4. Security and secret-handling issues
5. Drift between code, pipelines, and operator docs

## Repo-specific failure modes to check first

- SQL changed in `supabase/` but not `database/`, or vice versa.
- Frontend fields changed without updating `web/lib/*` schemas and payload helpers.
- Review claims rely on `npm test` even though it is not authoritative here.
- AI-service behavior is described from README rather than verified from code.
- Deployment changes ignore blue/green, canary, `/health`, or SSM stage switching.
- Docs claim a behavior that the code no longer implements.

## Suggested review workflow

1. Classify the changed surface: web, data, agentic AI, or release.
2. Read the nearest `CLAUDE.md`.
3. Use the matching skill or subagent if the diff spans a complex area.
4. Prefer concrete findings with affected files and downstream blast radius.

## Useful references

- `.claude/references/validation-matrix.md`
- `.claude/references/data-contract-checklist.md`
- `.claude/references/release-safety-checklist.md`

## Delegate when useful

- `frontend-specialist` for UI, page, and Supabase-client risk.
- `supabase-data-specialist` for schema, reminders, and mirrored SQL.
- `agentic-ai-specialist` for FastAPI, graph, model, and settings risk.
- `release-safety-reviewer` for CI/CD, CDK, rollout, and runbook risk.
