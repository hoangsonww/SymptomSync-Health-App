terraform {
  required_version = ">= 1.5"

  required_providers {
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.39"
    }
  }
}
