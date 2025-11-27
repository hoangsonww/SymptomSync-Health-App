# Progressive Delivery Runbook (Blue/Green + Canary)

This playbook documents how we ship safely using two API Gateway stages (blue/green) and CodeDeploy-backed Lambda canaries. Active traffic is tracked via the SSM parameter `/symptomsync/active_stage`.

## What the stack provides
- API Gateway `blue` and `green` stages with logging/tracing enabled. Stage URLs are exported from CloudFormation outputs (`BlueStageUrl`, `GreenStageUrl`).
- All Lambdas (API, chatbot, storage, reminder processor) are fronted by a `live` alias with CodeDeploy `CANARY_10PERCENT_5MINUTES` and CloudWatch alarms to auto-rollback on errors.
- S3 buckets are now retained by default for safer production posture.

## Release flow
1. **Deploy infra/app** – `cdk deploy` publishes new Lambda versions. CodeDeploy automatically shifts 10% traffic to the new version for five minutes before completing.
2. **Smoke-test inactive color** – run the Ansible playbook to test the opposite stage from what SSM reports.
   ```bash
   AWS_REGION=us-east-1 ansible-playbook ansible/blue-green-rollout.yml
   ```
   - Override with `TARGET_STAGE=blue|green` to force a specific stage.
   - Adjust `SMOKE_PATH=/health` if the health endpoint moves.
3. **Cutover** – the playbook updates `/symptomsync/active_stage` after a successful smoke test, indicating which stage should receive external traffic (via DNS/BasePath mappings).

## Rollback
- **Canary rollback** – CodeDeploy auto-rolls back if CloudWatch alarms fire during the 10% bake. For a manual stop:
  ```bash
  aws deploy list-deployments --application-name ApiDeploymentGroup
  aws deploy stop-deployment --deployment-id <id>
  ```
- **Blue/green rollback** – update the SSM parameter back to the prior color and point DNS/BasePath mapping accordingly:
  ```bash
  aws ssm put-parameter --name /symptomsync/active_stage --type String --overwrite --value blue
  ```

## Observability checks
- Watch `Errors` and `Duration` metrics on the `live` aliases in CloudWatch.
- Validate API Gateway access logs per stage when verifying routing.
- Confirm scheduled reminder invocations via the `ReminderProcessor` alias metrics.
