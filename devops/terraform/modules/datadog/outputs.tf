output "lambda_error_monitor_id" {
  description = "ID of the Lambda error rate monitor"
  value       = datadog_monitor.lambda_errors.id
}

output "apigw_5xx_monitor_id" {
  description = "ID of the API Gateway 5XX monitor"
  value       = datadog_monitor.apigw_5xx.id
}

output "apigw_latency_monitor_id" {
  description = "ID of the API Gateway latency monitor"
  value       = datadog_monitor.apigw_latency.id
}

output "lambda_duration_monitor_id" {
  description = "ID of the Lambda duration monitor"
  value       = datadog_monitor.lambda_duration.id
}

output "lambda_throttles_monitor_id" {
  description = "ID of the Lambda throttles monitor"
  value       = datadog_monitor.lambda_throttles.id
}

output "dynamodb_throttles_monitor_id" {
  description = "ID of the DynamoDB throttles monitor"
  value       = datadog_monitor.dynamodb_throttles.id
}

output "waf_blocked_monitor_id" {
  description = "ID of the WAF blocked requests monitor"
  value       = datadog_monitor.waf_blocked.id
}

output "canary_health_monitor_id" {
  description = "ID of the CodeDeploy canary health monitor"
  value       = datadog_monitor.canary_health.id
}

output "health_synthetic_id" {
  description = "ID of the health endpoint synthetic test"
  value       = datadog_synthetics_test.health_check.id
}

output "dashboard_url" {
  description = "URL of the Datadog overview dashboard (check Datadog UI for full link)"
  value       = datadog_dashboard_json.overview.dashboard_lists_removed
}
