# Monitoring & Alerting

This directory describes baseline observability for production.

## Platforms

### Datadog (primary)
Datadog is the primary observability platform providing APM, metrics, logs, dashboards, monitors, and synthetic tests.

- **Setup**: See `datadog/README.md` for configuration and deployment instructions.
- **Dashboard**: `datadog/dashboard.json` – comprehensive production overview (Lambda, API GW, DynamoDB, WAF, CodeDeploy, cost).
- **Monitors**: `datadog/monitors.json` – 10 alert definitions with severity levels P1–P3, runbook-linked messages, and escalation paths.
- **Terraform**: `devops/terraform/modules/datadog/` – infrastructure-as-code for monitors, dashboards, and synthetic tests.
- **Lambda integration**: Datadog Extension + Node tracer layers on all Lambda functions (configured in CDK stack).
- **CI/CD integration**: Deployment events sent from GitHub Actions, Jenkins, and Ansible via `datadog-ci` and Events API.

### CloudWatch (baseline)
CloudWatch alarms are provisioned by CDK for 5XX rate and P95 latency per API Gateway stage, and for Lambda errors on CodeDeploy canary groups.

### Prometheus / Grafana (optional)
- `alertmanager/alertmanager.yml` – sample Alertmanager routes for Prometheus stacks.
- `grafana-dashboards/api-overview.json` – dashboard for API, Lambda, and canary health.

## Metrics
- **API latency & errors**: API Gateway per-stage 4XX/5XX, Latency, IntegrationLatency.
- **Lambda**: Errors, Duration, Throttles on `live` aliases; provisioned concurrency utilization; cold starts.
- **Reminders**: Invocation failures for `ReminderProcessor`.
- **DynamoDB**: Read/write capacity, throttled requests, latency by table.
- **WAF**: Allowed vs blocked requests, rule-level breakdown.
- **CodeDeploy**: Deployment success/failure, canary progression.
- **Frontend**: Add Datadog RUM SDK to capture page load, web vitals, and JS errors.

## Alerts

| Priority | Example | Channel |
|----------|---------|---------|
| P1 | 5XX rate > 10 in 5m, Lambda errors > 5, canary failure, health endpoint down | Slack + PagerDuty |
| P2 | P95 latency > 2s, Lambda throttles, DynamoDB throttles | Slack |
| P3 | WAF blocked spike, reminder processor failures | Slack (low-priority) |

## Log routing
- **Datadog**: Lambda Extension ships logs directly; CloudWatch logs forwarded via AWS integration.
- **SIEM**: Ship CloudWatch logs via subscription filter (Kinesis Firehose or Lambda).
- Enable API Gateway access logs per stage for traffic splits.

## Artifacts
- `datadog/` – Datadog dashboard, monitors, and setup guide.
- `alertmanager/alertmanager.yml` – Prometheus Alertmanager routes.
- `grafana-dashboards/api-overview.json` – Grafana dashboard.
