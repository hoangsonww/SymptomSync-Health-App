# Jenkins Pipelines

This directory contains Jenkins pipeline definitions that replicate the GitHub Actions workflow used in this project.

## Jenkinsfile

`Jenkinsfile` defines a complete CI/CD pipeline with the following stages:

1. **Preflight: Format & Lint** – install dependencies and lint the code.
2. **Security & License Scan** – run `npm audit`, `license-checker`, ESLint, and Semgrep.
3. **Unit & E2E Tests** – execute tests in parallel against Node 18 and Node 20.
4. **Build Next.js (web/)** – build the Next.js application and stash the build output.
5. **Build & Push Docker Image** – build and push an image to GHCR using Jenkins credentials.
6. **Image Vulnerability Scan** – scan the resulting image with Trivy.
7. **Sign Image (Cosign)** – optionally sign the pushed image when `COSIGN_KEY` is provided on the agent.
8. **Performance Benchmark** – run a container and execute an Artillery smoke test.
9. **Deploy Infrastructure (AWS CDK)** – deploy the AWS stack (API Gateway, Lambda, Cognito, DynamoDB) with CodeDeploy canaries and blue/green stages.
10. **Progressive Delivery (Blue/Green + Canary)** – run `ansible/blue-green-rollout.yml` to smoke test the inactive stage and flip the SSM-backed active stage flag.

Update the credential IDs (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_AI_API_KEY`, `ghcr`) in Jenkins to match your environment before running the pipeline.
