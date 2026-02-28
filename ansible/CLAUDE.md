# Ansible Notes

- `blue-green-rollout.yml` is not generic automation. It smoke-tests the inactive API Gateway stage, then flips `/symptomsync/active_stage`.
- Default smoke path is `/health`. If you change health semantics, update the playbook and the runbooks together.
- Review `DEPLOYMENTS.md` and `devops/runbooks/progressive-delivery.md` when making rollout changes.
