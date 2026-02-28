# AWS Notes

- The CDK entrypoint is `bin/symptomsync.ts`; the main stack is `lib/symptomsync-stack.js`.
- Lambda entry paths in the stack are repo-root-relative (`aws/lambda/...`). Preserve that assumption unless you update the CDK wiring intentionally.
- This stack includes canary Lambda deployment groups, `live` aliases, blue/green API Gateway stages, WAF, and the SSM parameter `/symptomsync/active_stage`. Treat these as core release mechanics, not incidental details.
- `chatbotHandler.js` currently uses placeholder Vertex AI project configuration; verify intent before treating it as production-ready.

## Validation

- If dependencies are available, prefer `npx cdk synth`.
- When changing public routes, auth, or health behavior, also inspect `ansible/blue-green-rollout.yml`, `DEPLOYMENTS.md`, and `devops/runbooks/progressive-delivery.md`.
