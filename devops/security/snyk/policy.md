# Snyk Usage Policy

- Projects: `web` (Node), `agentic_ai` (Python), container image `ghcr.io/<org>/symptomsync:latest`.
- Severity gates: fail on **high** and **critical**; warn on medium.
- PR checks: `snyk test --all-projects --severity-threshold=high`.
- Container: `snyk container test ghcr.io/<org>/symptomsync:latest`.
- Reporting: upload SARIF to CI artifact store for audit.
