---
name: symptomsync-release-change
description: Use when tasks touch deployment, infrastructure, CI/CD, or operational docs in aws/, ansible/, jenkins/, devops/, Dockerfile, .devcontainer/, or .github/workflows/ci.yml. Especially relevant for CDK stack changes, Lambda handlers, blue-green rollout logic, canary deployment behavior, image build/publish steps, and production-readiness or progressive-delivery documentation.
---

# SymptomSync Release Change

Use this skill for infra, delivery, and ops changes.

## Workflow

1. Read the nearest directory `CLAUDE.md` plus `CLAUDE.md` at repo root.
2. Determine which surfaces are coupled:
   - CDK stack in `aws/`
   - rollout automation in `ansible/`
   - Jenkins pipeline
   - GitHub Actions pipeline
   - runbooks and deployment docs
3. Make the smallest safe change, then update every coupled operational artifact.

## Guardrails

- Preserve Lambda `live` aliases, CodeDeploy canary groups, blue/green stages, WAF wiring, `/health`, and `/symptomsync/active_stage` unless the task explicitly changes them.
- Do not change rollout assumptions in code without updating `ansible/blue-green-rollout.yml` and the runbooks.
- Treat `DEPLOYMENTS.md` and the `devops/runbooks/` files as required follow-through when deployment behavior changes.
- Be skeptical of placeholder or aspirational code, especially around the chatbot Lambda and cloud integrations.

## Validation

1. If possible, run `npx cdk synth` in `aws/`.
2. Re-read `.github/workflows/ci.yml` and `jenkins/Jenkinsfile` together when build, test, or deploy stages change.
3. Re-read `DEPLOYMENTS.md`, `devops/runbooks/progressive-delivery.md`, and `devops/runbooks/production-readiness.md` when rollout or health semantics change.

## Use related assets when helpful

- `.claude/references/release-safety-checklist.md`
- `.claude/references/validation-matrix.md`
- `.claude/references/repo-surface-map.md`

## Delegate when useful

- Use `release-safety-reviewer` for rollout, runbook, and pipeline coherence checks.
- Pair with `frontend-specialist` or `agentic-ai-specialist` if infra changes alter app contracts.
