# Release Safety Checklist

Use this when tasks touch `aws/`, `ansible/`, `jenkins/`, `.github/workflows/ci.yml`, `Dockerfile`, or runbooks.

## Preserve these mechanics unless the task explicitly changes them

- Lambda `live` aliases
- CodeDeploy canary deployment groups
- API Gateway `blue` and `green` stages
- SSM parameter `/symptomsync/active_stage`
- `/health` endpoint used for smoke checks
- WAF and CloudWatch alarm wiring

## When routes, env vars, or deployment flow change

1. Inspect `aws/lib/symptomsync-stack.js`.
2. Inspect `ansible/blue-green-rollout.yml`.
3. Inspect `.github/workflows/ci.yml` and `jenkins/Jenkinsfile`.
4. Inspect `DEPLOYMENTS.md`, `devops/runbooks/progressive-delivery.md`, and `devops/runbooks/production-readiness.md`.

## Common drift risks

- GitHub Actions and Jenkins no longer build or test the same way.
- Runbooks still mention old health paths, secret names, or rollout steps.
- CDK changes break the playbook assumptions about stage names or SSM state.
- Public claims of production readiness outrun what the code currently implements.
