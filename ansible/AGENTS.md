# Ansible Notes

- `blue-green-rollout.yml` smoke-tests the inactive API Gateway stage and flips `/symptomsync/active_stage`.
- Default smoke path is `/health`. If health behavior changes, update the playbook and runbooks together.

## Skills

- Use `$symptomsync-release-change` for rollout changes.
