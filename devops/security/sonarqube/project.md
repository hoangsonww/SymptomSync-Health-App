# SonarQube Project Setup

- Key: `symptomsync`
- Languages: TypeScript/JavaScript (`web`), Python (`agentic_ai`).
- Quality gate: no new code with reliability/security issues rating worse than B and coverage drop allowed <= 3%.
- Recommended scan command:
  ```bash
  sonar-scanner \
    -Dsonar.projectKey=symptomsync \
    -Dsonar.sources=web,agentic_ai \
    -Dsonar.javascript.lcov.reportPaths=web/coverage/lcov.info \
    -Dsonar.python.coverage.reportPaths=agentic_ai/coverage.xml
  ```
