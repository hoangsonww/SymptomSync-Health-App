# Release Safety Checklist

## Surfaces to inspect together

- `aws/lib/symptomsync-stack.js`
- `ansible/blue-green-rollout.yml`
- `.github/workflows/ci.yml`
- `jenkins/Jenkinsfile`
- `DEPLOYMENTS.md`
- `devops/runbooks/progressive-delivery.md`
- `devops/runbooks/production-readiness.md`

## Common drift risks

- GitHub Actions and Jenkins stop building or testing the same way.
- Runbooks mention old health paths, secret names, or rollout steps.
- CDK changes break the playbook assumptions about stage names or SSM state.
- Public claims of production readiness outrun what the code currently implements.

## Commands

- Preferred safe validation: `npx cdk synth`
- High-risk commands that should be reviewed carefully: `npx cdk deploy`, `ansible-playbook`, `aws ssm put-parameter`, `docker push`
