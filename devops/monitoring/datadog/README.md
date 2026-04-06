# Datadog Integration for SymptomSync

Configuration files for Datadog observability across the SymptomSync platform.

## Files

| File | Purpose |
|------|---------|
| `dashboard.json` | Production overview dashboard (Lambda, API GW, DynamoDB, WAF, CodeDeploy) |
| `monitors.json` | Alert definitions with runbook-linked messages and escalation paths |

## Setup

### 1. Prerequisites

- Datadog account with API key and Application key
- AWS integration enabled in Datadog (for CloudWatch metrics forwarding)
- Datadog Lambda Extension layer added to all Lambda functions (done via CDK stack)

### 2. Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DD_API_KEY` | Lambda, CI/CD, Ansible | Datadog API key for metric/log/event submission |
| `DD_APP_KEY` | Terraform only | Application key for managing monitors/dashboards |
| `DD_SITE` | Everywhere | `datadoghq.com` (US) or `datadoghq.eu` (EU) |
| `DD_ENV` | Lambda, Docker | Environment tag (`production`, `staging`) |
| `DD_SERVICE` | Lambda, Docker | Service name: `symptomsync` |
| `DD_VERSION` | Lambda, Docker | App version for deployment tracking |

### 3. Deploy via Terraform

```bash
cd devops/terraform/environments/prod
export TF_VAR_datadog_api_key="<your-api-key>"
export TF_VAR_datadog_app_key="<your-app-key>"
export TF_VAR_health_endpoint_url="https://<api-id>.execute-api.us-east-1.amazonaws.com/blue/health"
terraform init
terraform plan
terraform apply
```

### 4. Manual Import (alternative)

If not using Terraform, import the dashboard and monitors via the Datadog API:

```bash
# Dashboard
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" \
  -d @dashboard.json

# Monitors
for monitor in $(jq -c '.monitors[]' monitors.json); do
  curl -X POST "https://api.datadoghq.com/api/v1/monitor" \
    -H "DD-API-KEY: $DD_API_KEY" \
    -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
    -H "Content-Type: application/json" \
    -d "$monitor"
done
```

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│ Lambda Fns   │───▶│ DD Extension │───▶│ Datadog Intake │
│ (live alias) │    │   Layer      │    │                │
└─────────────┘    └──────────────┘    └────────────────┘
                                              │
┌─────────────┐    ┌──────────────┐           ▼
│ CloudWatch   │───▶│ AWS Integration│──▶ ┌────────────┐
│ Metrics/Logs │    │ (Datadog)    │    │ Dashboards │
└─────────────┘    └──────────────┘    │ Monitors   │
                                       │ Synthetics │
┌─────────────┐                        └────────────┘
│ CI/CD Events │──────────────────────▶      │
│ (GHA/Jenkins)│    (datadog-ci)             ▼
└─────────────┘                     ┌────────────────┐
                                    │ Alerts:        │
┌─────────────┐                     │ Slack/PagerDuty│
│ Ansible      │─── DD Event API ──▶│                │
│ Rollout      │                    └────────────────┘
└─────────────┘
```

## Monitor Severity Mapping

| Priority | Alert Channel | Response SLA |
|----------|--------------|-------------|
| P1 | Slack + PagerDuty | 15 min acknowledge |
| P2 | Slack | 1 hour acknowledge |
| P3 | Slack (low-priority) | Next business day |
