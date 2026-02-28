# Jenkins Notes

- `Jenkinsfile` mirrors the GitHub Actions pipeline but adds image signing, CDK deployment, and progressive delivery steps.
- If you change build, test, or deployment commands here, inspect `.github/workflows/ci.yml` and `jenkins/README.md` so the two pipelines do not drift accidentally.
- This pipeline assumes credentials for GHCR, Supabase env vars, and `GOOGLE_AI_API_KEY`.
- Keep stage ordering coherent: lint/test/build/security before image publication and deployment.
