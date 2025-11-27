# Production Readiness Checklist

Use this before any prod cutover.

## Platform
- DNS points to active API Gateway stage (from `/symptomsync/active_stage`).
- TLS certs valid (ACM) for all domains.
- WAF enabled on API Gateway with core managed rules + rate limits.
- CloudWatch alarms deployed for 5XX rate, latency, Lambda errors, and reminder job failures.

## App
- Health endpoint responds 200 from both blue and green stages.
- Canary deploys succeeding (CodeDeploy) with no alarm-triggered rollbacks.
- Smoke tests pass via `ansible/blue-green-rollout.yml` prior to traffic shift.

## Data & Secrets
- SSM/Secrets Manager contains all runtime secrets; no plaintext secrets in env files.
- Backups: RDS/Postgres snapshots or Supabase backups scheduled and verified.
- Buckets encrypt at rest; public access blocks enabled where applicable.

## Security
- Latest images scanned (Trivy) and signed (cosign).
- SAST, dependency, and secrets scans clean or with approved waivers.
- IAM policies reviewed for least privilege; unused keys rotated.

## Reliability
- Error budgets and SLOs defined (e.g., 99.9% uptime, P95 < 2s).
- Load/perf smoke run (Artillery) on new release.
- Runbook links: `progressive-delivery.md`, monitoring escalation paths, on-call rotation.
