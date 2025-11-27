# Terraform Environments

Use this layout to keep per-environment state isolated and tagged.

## Structure
- `prod/` – production variables, remote state.
- `staging/` – pre-prod.
- `modules/` – shared modules (VPC, API Gateway, ACM) if added later.

## Backend template
Example `prod/backend.tf` (fill bucket/key accordingly):
```hcl
terraform {
  backend "s3" {
    bucket = "symptomsync-tfstate"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}
```

## Workflow
```bash
cd devops/terraform/environments/prod
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

Tag every resource with `Project = "SymptomSync"` and `Environment` for cost/audit tracking. Keep production changes behind PRs with `terraform plan` output attached.
