---
name: symptomsync-doc-sync
description: Workflow for keeping SymptomSync's checked-in docs aligned with implementation. Use when changes alter behavior described in README.md, ARCHITECTURE.md, DEPLOYMENTS.md, docs/, jenkins/README.md, or devops/runbooks/, or when a task is specifically about reconciling documentation with the current code.
---

# SymptomSync Doc Sync

Use this skill when code and docs may have drifted.

## Workflow

1. Identify which behavior changed and which docs mention it.
2. Verify the current behavior from code before editing prose.
3. Update only the documents that are now stale.
4. Keep claims concrete; avoid marketing language when operational details are the point.

## Main doc targets

- `README.md`
- `ARCHITECTURE.md`
- `DEPLOYMENTS.md`
- `docs/DESIGN.md`
- `jenkins/README.md`
- `devops/runbooks/progressive-delivery.md`
- `devops/runbooks/production-readiness.md`

Read `references/doc-map.md` when you need the doc-to-code mapping.

## Guardrails

- Prefer code-backed statements over aspirational language.
- If timing, schedules, or rollout behavior matters, trust the checked-in code and SQL over older prose docs.
- Update the narrowest stale document set rather than rewriting everything.

## Related skills

- Use the area-specific skill first if the change is in web, data, agentic AI, or release infrastructure.
- Use `$symptomsync-review` if you want to review for drift instead of editing it.
