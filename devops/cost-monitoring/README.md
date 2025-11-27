# Cost Monitoring

Baseline practices to keep cloud spend predictable.

## Dashboards
- **AWS Cost Explorer**: daily granularity, filter by `Project:SymptomSync` tag.
- **Budgets**: monthly budget with email/Slack alerts at 50/80/100% thresholds.

## CLI playbooks
- Current month spend:
  ```bash
  aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date -v+1m +%Y-%m-01) --granularity=DAILY --metrics UnblendedCost
  ```
- Top 5 services (last 7 days):
  ```bash
  aws ce get-cost-and-usage --time-period Start=$(date -v-7d +%Y-%m-%d),End=$(date +%Y-%m-%d) --granularity=DAILY \
    --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
  ```

## Guardrails
- Tag all resources with `Project:SymptomSync`, `Environment`, and `Owner`.
- Enable S3/Lambda lifecycle policies to clean up unused versions and logs.
- Use Savings Plans for steady Lambda/CloudFront traffic once baselined.
