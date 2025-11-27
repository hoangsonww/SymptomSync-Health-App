# Monitoring & Alerting

This directory describes baseline observability for production.

## Metrics
- **API latency & errors**: API Gateway per-stage 4XX/5XX, Latency, IntegrationLatency.
- **Lambda**: Errors, Duration, Throttles on `live` aliases; provisioned concurrency utilization.
- **Reminders**: Invocation failures for `ReminderProcessor`.
- **Frontend**: Add RUM (e.g., OpenTelemetry JS exporter) to capture page load, web vitals, and JS errors.

## Alerts (examples)
- P1: 5XX rate > 2% for 5 minutes on active stage.
- P1: Lambda Errors > 0 for 2 consecutive periods post-deploy.
- P2: P95 latency > 2s for 5 minutes.
- P3: CloudFront or API Gateway 4XX rate > 5%.

## Artifacts
- `alertmanager/alertmanager.yml` – sample Alertmanager routes for Prometheus stacks.
- `grafana-dashboards/api-overview.json` – dashboard for API, Lambda, and canary health.

## Log routing
- Ship CloudWatch logs to a SIEM via subscription filter (Kinesis Firehose or Lambda).
- Enable API Gateway access logs per stage for traffic splits.
