variable "environment" {
  description = "Deployment environment (prod, staging)"
  type        = string
  default     = "prod"
}

variable "health_endpoint_url" {
  description = "Full URL to the /health endpoint on the active API Gateway stage"
  type        = string
}

variable "notification_channels" {
  description = "Datadog notification targets (e.g., @slack-prod-alerts)"
  type        = list(string)
  default     = ["@slack-prod-alerts"]
}

variable "tags" {
  description = "Additional tags for all Datadog resources"
  type        = map(string)
  default     = {}
}
