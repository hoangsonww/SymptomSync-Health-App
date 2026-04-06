# ── Local helpers ─────────────────────────────────────────────

locals {
  notify = join(" ", var.notification_channels)
  common_tags = concat(
    ["project:symptomsync", "env:${var.environment}", "team:platform"],
    [for k, v in var.tags : "${k}:${v}"]
  )
}

# ══════════════════════════════════════════════════════════════
# Monitors
# ══════════════════════════════════════════════════════════════

# ── P1: Lambda error rate (any function) ──────────────────────

resource "datadog_monitor" "lambda_errors" {
  name    = "[SymptomSync] Lambda Error Rate High"
  type    = "metric alert"
  message = <<-EOT
    Lambda error rate exceeded threshold on {{functionname.name}}.
    Check CloudWatch logs and CodeDeploy status.
    Runbook: devops/runbooks/progressive-delivery.md
    ${local.notify}
  EOT

  query = "sum(last_5m):sum:aws.lambda.errors{project:symptomsync} by {functionname}.as_count() > 5"

  monitor_thresholds {
    critical = 5
    warning  = 2
  }

  notify_no_data    = true
  no_data_timeframe = 10
  renotify_interval = 30
  priority          = 1

  tags = local.common_tags
}

# ── P1: API Gateway 5XX rate per stage ────────────────────────

resource "datadog_monitor" "apigw_5xx" {
  name    = "[SymptomSync] API Gateway 5XX Rate High (${var.environment})"
  type    = "metric alert"
  message = <<-EOT
    5XX error rate on API Gateway stage {{stage.name}} exceeds threshold.
    Verify active stage via SSM /symptomsync/active_stage.
    Consider blue/green rollback: aws ssm put-parameter --name /symptomsync/active_stage --type String --overwrite --value <prior_color>
    ${local.notify}
  EOT

  query = "sum(last_5m):sum:aws.apigateway.5xx{apiname:symptomsync_service} by {stage}.as_count() > 10"

  monitor_thresholds {
    critical = 10
    warning  = 5
  }

  notify_no_data    = false
  renotify_interval = 15
  priority          = 1

  tags = local.common_tags
}

# ── P2: API Gateway P95 latency ──────────────────────────────

resource "datadog_monitor" "apigw_latency" {
  name    = "[SymptomSync] API Gateway P95 Latency High"
  type    = "metric alert"
  message = <<-EOT
    P95 latency on API Gateway exceeds 2s for stage {{stage.name}}.
    Check Lambda cold starts and provisioned concurrency settings.
    ${local.notify}
  EOT

  query = "avg(last_5m):p95:aws.apigateway.latency{apiname:symptomsync_service} by {stage} > 2000"

  monitor_thresholds {
    critical = 2000
    warning  = 1500
  }

  renotify_interval = 30
  priority          = 2

  tags = local.common_tags
}

# ── P2: Lambda duration (cold starts / slow invocations) ──────

resource "datadog_monitor" "lambda_duration" {
  name    = "[SymptomSync] Lambda Duration High"
  type    = "metric alert"
  message = <<-EOT
    Lambda p95 duration exceeds threshold for {{functionname.name}}.
    Check provisioned concurrency and cold start rates.
    All four functions (ApiHandler, ReminderProcessor, ChatbotHandler, StorageHandler)
    have provisioned concurrency = 1 on their live aliases.
    ${local.notify}
  EOT

  query = "avg(last_10m):p95:aws.lambda.duration{project:symptomsync} by {functionname} > 8000"

  monitor_thresholds {
    critical = 8000
    warning  = 5000
  }

  priority = 2
  tags     = local.common_tags
}

# ── P2: Lambda throttles ─────────────────────────────────────

resource "datadog_monitor" "lambda_throttles" {
  name    = "[SymptomSync] Lambda Throttles Detected"
  type    = "metric alert"
  message = <<-EOT
    Lambda throttles detected for {{functionname.name}}.
    Review concurrency limits and provisioned concurrency settings.
    Current provisioned concurrency: 1 per live alias.
    ${local.notify}
  EOT

  query = "sum(last_5m):sum:aws.lambda.throttles{project:symptomsync} by {functionname}.as_count() > 0"

  monitor_thresholds {
    critical = 0
  }

  priority = 2
  tags     = local.common_tags
}

# ── P2: DynamoDB throttled requests ───────────────────────────

resource "datadog_monitor" "dynamodb_throttles" {
  name    = "[SymptomSync] DynamoDB Throttled Requests"
  type    = "metric alert"
  message = <<-EOT
    DynamoDB table {{tablename.name}} is being throttled.
    All tables use PAY_PER_REQUEST billing — throttles here indicate
    partition-level hot keys or account-level throughput limits.
    ${local.notify}
  EOT

  query = "sum(last_5m):sum:aws.dynamodb.throttled_requests{project:symptomsync} by {tablename}.as_count() > 0"

  monitor_thresholds {
    critical = 0
  }

  priority = 2
  tags     = local.common_tags
}

# ── P3: WAF blocked requests spike ───────────────────────────

resource "datadog_monitor" "waf_blocked" {
  name    = "[SymptomSync] WAF Blocked Requests Spike"
  type    = "metric alert"
  message = <<-EOT
    WAF blocked request count is unusually high. Possible attack or false-positive rule.
    WAF is associated with both blue and green API Gateway stages.
    Check WAF sampled requests in AWS console for blocked rule details.
    ${local.notify}
  EOT

  query = "sum(last_15m):sum:aws.wafv2.blocked_requests{webacl:symptomsync-waf}.as_count() > 500"

  monitor_thresholds {
    critical = 500
    warning  = 200
  }

  priority = 3
  tags     = concat(local.common_tags, ["team:security"])
}

# ── P1: Canary deployment health ─────────────────────────────

resource "datadog_monitor" "canary_health" {
  name    = "[SymptomSync] Canary Deployment Unhealthy"
  type    = "metric alert"
  message = <<-EOT
    CodeDeploy canary showing errors during CANARY_10PERCENT_5MINUTES bake period.
    Auto-rollback should trigger via the per-alias error alarms.
    Verify in CodeDeploy console. Manual stop:
      aws deploy stop-deployment --deployment-id <id>
    ${local.notify}
  EOT

  query = "sum(last_5m):sum:aws.codedeploy.deployment_failures{project:symptomsync}.as_count() > 0"

  monitor_thresholds {
    critical = 0
  }

  priority = 1
  tags     = local.common_tags
}

# ══════════════════════════════════════════════════════════════
# Synthetic Tests
# ══════════════════════════════════════════════════════════════

resource "datadog_synthetics_test" "health_check" {
  name      = "[SymptomSync] Health Endpoint Synthetic (${var.environment})"
  type      = "api"
  subtype   = "http"
  status    = "live"
  message   = "Health endpoint failing. Check API Gateway and Lambda status. ${local.notify}"
  locations = ["aws:us-east-1", "aws:us-west-2", "aws:eu-west-1"]

  tags = local.common_tags

  request_definition {
    method = "GET"
    url    = var.health_endpoint_url
  }

  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }

  assertion {
    type     = "responseTime"
    operator = "lessThan"
    target   = "3000"
  }

  assertion {
    type     = "body"
    operator = "contains"
    target   = "ok"
  }

  options_list {
    tick_every = 60
    retry {
      count    = 2
      interval = 300
    }
    monitor_options {
      renotify_interval = 120
    }
  }
}

# ══════════════════════════════════════════════════════════════
# Dashboard
# ══════════════════════════════════════════════════════════════

resource "datadog_dashboard_json" "overview" {
  dashboard = file("${path.module}/dashboard.json")
}
