#!/usr/bin/env bash
#
# publish_frontend.sh
#
# Builds the SymptomSync frontend Docker image and pushes it to GitHub Container Registry.
#
# Prerequisites:
#   - A GitHub PAT with `write:packages` scope stored in GH_TOKEN
#   - Your GitHub username in GITHUB_ACTOR
#
# Usage:
#   chmod +x publish_frontend.sh
#   export GITHUB_ACTOR="hoangsonww"
#   export GH_TOKEN="<your_PAT_with_write:packages>"
#   ./publish_frontend.sh
#

set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------
IMAGE="ghcr.io/hoangsonww/symptomsync-frontend:0.1.0"

: "${GITHUB_ACTOR:?Please export GITHUB_ACTOR=<your GitHub username>}"
: "${GH_TOKEN:?Please export GH_TOKEN=<your PAT with write:packages>}"

echo "🔨 Building Docker image: $IMAGE"

# Build the image, picking up Dockerfile in current directory
docker build \
  --label org.opencontainers.image.source="https://github.com/comp426-25s/final-project-team-16" \
  -t "$IMAGE" .

echo "🔐 Logging in to ghcr.io as $GITHUB_ACTOR"
echo "$GH_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

echo "📤 Pushing image: $IMAGE"
docker push "$IMAGE"

echo "✅ Done! You can pull it with:"
echo "   docker pull $IMAGE"
