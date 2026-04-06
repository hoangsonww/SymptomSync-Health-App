variable "datadog_api_key" {
  description = "Datadog API key"
  type        = string
  sensitive   = true
}

variable "datadog_app_key" {
  description = "Datadog application key"
  type        = string
  sensitive   = true
}

variable "datadog_site" {
  description = "Datadog site (datadoghq.com or datadoghq.eu)"
  type        = string
  default     = "datadoghq.com"
}

variable "health_endpoint_url" {
  description = "Full URL to the /health endpoint on the active API Gateway stage"
  type        = string
}
