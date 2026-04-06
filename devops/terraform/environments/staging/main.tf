terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket = "symptomsync-tfstate"
    key    = "staging/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "datadog" {
  api_key = var.datadog_api_key
  app_key = var.datadog_app_key
  api_url = var.datadog_site == "datadoghq.eu" ? "https://api.datadoghq.eu" : "https://api.datadoghq.com"
}

provider "aws" {
  region = "us-east-1"
}

module "datadog" {
  source = "../../modules/datadog"

  environment           = "staging"
  health_endpoint_url   = var.health_endpoint_url
  notification_channels = ["@slack-staging-alerts"]

  tags = {
    managed_by = "terraform"
    cost_center = "platform"
  }
}
