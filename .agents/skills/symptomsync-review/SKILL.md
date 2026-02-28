---
name: symptomsync-review
description: Repo-specific review workflow for SymptomSync. Use when reviewing code, plans, or diffs across frontend, SQL, AI service, infrastructure, or CI/CD so the review reflects this repository's real failure modes such as mirrored SQL drift, weak frontend test wiring, doc-vs-code mismatches, config regressions, and unsafe release changes.
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
- Frontend fields changed without updating `web/lib/*` schemas and helper payloads.
- Review relies on `npm test` even though it is not authoritative here.
- AI-service claims are taken from README instead of verified code.
- Deployment changes ignore blue/green, canaries, `/health`, or SSM stage switching.
- Docs claim behavior that the code no longer implements.

Read `references/review-hotspots.md` for the most common review traps.

## Suggested review workflow

1. Classify the changed surface: web, data, agentic AI, release, or docs.
2. Read the nearest `AGENTS.md`.
3. Use the matching specialized skill when the diff spans a complex area.
4. Prefer concrete findings with affected files and downstream blast radius.

## Related skills

- Use `$symptomsync-web-change`, `$symptomsync-data-change`, `$symptomsync-agentic-ai-change`, or `$symptomsync-release-change` for deep area-specific context.
