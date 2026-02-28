# Doc Map

## Product and architecture docs

- `README.md`: broad feature list, install notes, architecture summary
- `ARCHITECTURE.md`: deeper technical architecture and service relationships
- `docs/DESIGN.md`: early design intent; some sections are historically outdated

## Delivery and operations docs

- `DEPLOYMENTS.md`: current deploy and rollback guidance
- `jenkins/README.md`: Jenkins pipeline behavior
- `devops/runbooks/progressive-delivery.md`: blue/green and canary rollout behavior
- `devops/runbooks/production-readiness.md`: production checklist

## Common drift points

- reminder cadence or health semantics described differently than SQL and code
- AI capabilities described more broadly than the checked-in implementation
- deployment docs lagging behind CDK, Jenkins, or Ansible changes
