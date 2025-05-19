#!/usr/bin/env bash
#
# Builds & pushes your .devcontainer image to GHCR
#
set -euo pipefail

IMAGE="ghcr.io/hoangsonww/devcontainer-setup:latest"

: "${GITHUB_ACTOR:?Please export GITHUB_ACTOR=<your GitHub username>}"
: "${GH_TOKEN:?Please export GH_TOKEN=<your PAT>}"

echo "🔨 Building $IMAGE from .devcontainer/"
docker build \
  --label org.opencontainers.image.title="devcontainer-setup" \
  --label org.opencontainers.image.description="Devcontainer with Node.js, Supabase CLI, zsh, etc." \
  -t "$IMAGE" .devcontainer/

echo "🔐 Logging in to GHCR as $GITHUB_ACTOR"
echo "$GH_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

echo "📤 Pushing $IMAGE"
docker push "$IMAGE"

echo "✅ Done. Pull via: docker pull $IMAGE"
