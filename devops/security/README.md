# Security & Compliance Hardening

This folder documents the minimum security controls expected in production. Integrate these jobs into CI/CD (Jenkins/GitHub Actions) and periodic scheduled scans.

## Pipeline gates
- **SAST**: `semgrep ci --config auto` with a baseline suppression file when needed. Fail on high/critical.
- **Dependency scanning**: `npm audit --audit-level=high --omit=dev` for web, `pip-audit` for Python services.
- **Container scanning**: `trivy image --severity HIGH,CRITICAL ghcr.io/<org>/symptomsync:latest` using `trivy/baseline.yaml` to suppress known, tracked issues.
- **License review**: `npx license-checker --production --start web` and archive output for audit.
- **Secrets detection**: `gitleaks detect --no-banner --redact` on each PR.

## Runtime protections
- Enforce least privilege IAM for Lambda roles (no `*:*`).
- Enable CloudWatch alarms for `Errors`, `Throttle`, and `5XX` across all `live` Lambda aliases.
- Turn on API Gateway WAF with managed core + rate-limit rules.
- Encrypt S3 buckets at rest (AES-256) and enforce TLS-only for uploads.

## Artifact signing
- Sign built images with `cosign sign ghcr.io/<org>/symptomsync:<tag>` and verify before deploy: `cosign verify`.

## Secrets management
- Use AWS SSM Parameter Store/Secrets Manager for runtime secrets (keys, DB URLs). Disallow plaintext envs in CI logs.

## Audit logging
- Enable CloudTrail and S3 access logs; ship Lambda logs to a SIEM via subscription filters.

## References
- `trivy/baseline.yaml` – suppressions for noisy CVEs (track expiration dates).
- `snyk/policy.md` – policy for Snyk CLI usage when enabled.
- `sonarqube/project.md` – minimal Sonar setup guidance.
