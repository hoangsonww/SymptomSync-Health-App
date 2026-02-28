# AWS Notes

- The CDK entrypoint is `bin/symptomsync.ts`; the main stack is `lib/symptomsync-stack.js`.
- Lambda entry paths are repo-root-relative (`aws/lambda/...`).
- This stack includes Lambda `live` aliases, CodeDeploy canaries, blue/green API Gateway stages, WAF, and the SSM parameter `/symptomsync/active_stage`.
- `lambda/chatbotHandler.js` still contains placeholder cloud configuration; verify intent before treating it as production-ready.

## Validation

- Prefer `npx cdk synth` when dependencies are available.
- If rollout behavior changes, inspect `ansible/blue-green-rollout.yml` and deployment docs in the same task.

## Skills

- Use `$symptomsync-release-change` for infra or deploy work.
- Use `$symptomsync-doc-sync` when deployment docs must be updated too.
