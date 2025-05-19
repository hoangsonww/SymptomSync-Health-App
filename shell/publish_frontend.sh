#!/usr/bin/env bash
#
# Builds & pushes SymptomSync frontend to GHCR
#
set -euo pipefail

# Image name + tag
IMAGE="ghcr.io/hoangsonww/symptomsync-frontend:0.1.0"

# Ensure credentials
: "${GITHUB_ACTOR:?Please export GITHUB_ACTOR=<your GitHub username>}"
: "${GH_TOKEN:?Please export GH_TOKEN=<your PAT>}"

# Compute build timestamp
BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "🔨 Building $IMAGE"
docker build \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --label org.opencontainers.image.source="https://github.com/comp426-25s/final-project-team-16" \
  -t "$IMAGE" web/

echo "🔐 Logging in to GHCR as $GITHUB_ACTOR"
echo "$GH_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

echo "📤 Pushing $IMAGE"
docker push "$IMAGE"

echo "✅ Done. Pull via: docker pull $IMAGE"
