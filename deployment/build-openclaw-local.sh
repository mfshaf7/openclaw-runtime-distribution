#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
IMAGE_TAG="${OPENCLAW_LOCAL_IMAGE_TAG:-openclaw:local}"
BASE_IMAGE="${OPENCLAW_BASE_IMAGE:-ghcr.io/openclaw/openclaw:latest}"
DOCKERFILE="${OPENCLAW_DOCKERFILE:-$ROOT/deployment/Dockerfile.plugin-install.example}"

if [[ ! -f "$DOCKERFILE" ]]; then
  echo "Missing Dockerfile: $DOCKERFILE" >&2
  exit 1
fi

echo "Preparing OpenClaw image build with bundled Telegram overlay and managed host-control plugin"
echo "  root      : $ROOT"
echo "  dockerfile: $DOCKERFILE"
echo "  base image: $BASE_IMAGE"
echo "  output tag: $IMAGE_TAG"
echo

"$ROOT/deployment/package-local-plugins.sh" "$ROOT"

echo
echo "Building Docker image..."
docker build \
  --build-arg OPENCLAW_BASE_IMAGE="$BASE_IMAGE" \
  -f "$DOCKERFILE" \
  -t "$IMAGE_TAG" \
  "$ROOT"

echo
echo "Build completed: $IMAGE_TAG"