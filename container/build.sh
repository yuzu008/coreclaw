#!/bin/bash
# Build the CoreClaw agent container image

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$SCRIPT_DIR"

IMAGE_NAME="coreclaw-agent"
TAG="${1:-latest}"
CONTAINER_RUNTIME="${CONTAINER_RUNTIME:-docker}"

echo "============================================"
echo "  CoreClaw Agent Container Build"
echo "============================================"
echo ""

# --- 1. Get latest GitHub Copilot CLI version ---
COPILOT_VER=$(npm view @github/copilot version 2>/dev/null || echo "latest")
echo "   Copilot CLI: v${COPILOT_VER}"
echo ""

# --- 2. Build container ---
cd "$SCRIPT_DIR"
echo "🐳 Building Docker image: ${IMAGE_NAME}:${TAG}"
echo ""

${CONTAINER_RUNTIME} build \
  --build-arg COPILOT_VERSION="${COPILOT_VER}" \
  --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -t "${IMAGE_NAME}:${TAG}" .

echo ""
echo "============================================"
echo "  ✅ Build complete!"
echo "============================================"
echo "  Image:         ${IMAGE_NAME}:${TAG}"
echo "  Copilot CLI:   v${COPILOT_VER}"
echo ""
echo "Test with:"
echo "  echo '{\"prompt\":\"Hello\",\"groupFolder\":\"test\",\"chatJid\":\"test\",\"isMain\":false}' | ${CONTAINER_RUNTIME} run -i -e GITHUB_TOKEN=\$(gh auth token) ${IMAGE_NAME}:${TAG}"
