#!/usr/bin/env bash
#
# publish_devcontainer.sh
#
# Builds the .devcontainer Docker image and pushes it to GitHub Container Registry (GHCR)
# under the name "devcontainer-setup:latest".
#
# Prerequisites:
#   - A GitHub PAT with the `write:packages` scope stored in GH_TOKEN
#   - Your GitHub username in GITHUB_ACTOR
#
# Usage:
#   chmod +x publish_devcontainer.sh
#   export GITHUB_ACTOR="hoangsonww"
#   export GH_TOKEN="<your_PAT_with_write:packages>"
#   ./publish_devcontainer.sh
#

set -euo pipefail

# ----------------------------------------------------------------------------
# Image configuration
# ----------------------------------------------------------------------------
IMAGE="ghcr.io/hoangsonww/devcontainer-setup:latest"
DEVCONTAINER_DIR=".devcontainer"

: "${GITHUB_ACTOR:?Please export GITHUB_ACTOR=<your GitHub username>}"
: "${GH_TOKEN:?Please export GH_TOKEN=<your PAT with write:packages>}"

echo "🔨 Building devcontainer image from $DEVCONTAINER_DIR → $IMAGE"

# Build the image using the Dockerfile inside .devcontainer/
docker build \
  --label org.opencontainers.image.title="devcontainer-setup" \
  --label org.opencontainers.image.version="latest" \
  --label org.opencontainers.image.description="Custom devcontainer environment with Node.js, PostgreSQL client, zsh & Oh My Zsh" \
  -t "$IMAGE" \
  "$DEVCONTAINER_DIR"

echo "🔐 Logging in to GHCR (ghcr.io) as $GITHUB_ACTOR"
echo "$GH_TOKEN" | docker login ghcr.io \
  --username "$GITHUB_ACTOR" \
  --password-stdin

echo "📤 Pushing image: $IMAGE"
docker push "$IMAGE"

echo "✅ Done! You can now pull your devcontainer with:"
echo "    docker pull $IMAGE"
