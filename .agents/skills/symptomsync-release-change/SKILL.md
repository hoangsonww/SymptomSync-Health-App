---
name: symptomsync-release-change
description: Guide for making safe changes to SymptomSync infrastructure, CI/CD, deployment, and operational behavior. Use when tasks touch aws/, ansible/, jenkins/, devops/, Dockerfile, .devcontainer/, or .github/workflows/ci.yml, especially for CDK stack changes, blue-green rollout logic, canary deployment behavior, pipeline changes, or production-readiness docs.
---

# SymptomSync Release Change

Use this skill when the task affects deployment or release operations.

## Workflow

1. Read the nearest `AGENTS.md` plus the repo-root `AGENTS.md`.
2. Determine which surfaces are coupled:
   - CDK stack in `aws/`
   - rollout automation in `ansible/`
   - Jenkins pipeline
   - GitHub Actions pipeline
   - runbooks and deployment docs
3. Make the smallest safe change.
4. Update every coupled operational artifact that becomes stale.

## Preserve these mechanics unless the task explicitly changes them

- Lambda `live` aliases
- CodeDeploy canary deployment groups
- API Gateway `blue` and `green` stages
- `/health` smoke path unless intentionally changed
- SSM parameter `/symptomsync/active_stage`
- WAF and alarm wiring

Read `references/release-safety-checklist.md` when you need the rollout and drift checklist.

## Validation

1. If possible, run `npx cdk synth` in `aws/`.
2. Re-read `.github/workflows/ci.yml` and `jenkins/Jenkinsfile` together when build, test, or deploy stages change.
3. Re-read `DEPLOYMENTS.md`, `devops/runbooks/progressive-delivery.md`, and `devops/runbooks/production-readiness.md` when rollout or health semantics change.

## Guardrails

- Do not change rollout assumptions in code without updating `ansible/blue-green-rollout.yml` and the runbooks.
- Treat placeholder or aspirational cloud code skeptically, especially around chatbot integrations.
- Flag drift between Jenkins and GitHub Actions immediately.

## Related skills

- Use `$symptomsync-doc-sync` when code changes force runbook or deployment doc updates.
- Use `$symptomsync-review` for a release-safety review pass.
