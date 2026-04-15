#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
PARENT="$(cd -- "$ROOT/.." && pwd)"
CANON_BRIDGE="${OPENCLAW_HOST_BRIDGE_REPO:-$PARENT/openclaw-host-bridge}"

if [[ ! -d "$CANON_BRIDGE" ]]; then
  echo "Missing canonical bridge repo: $CANON_BRIDGE" >&2
  exit 1
fi

required_paths=(
  "$CANON_BRIDGE/src"
  "$CANON_BRIDGE/test"
  "$CANON_BRIDGE/config"
  "$CANON_BRIDGE/scripts"
)

missing=0
for path in "${required_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "Missing expected bridge repo path: $path" >&2
    missing=1
  fi
done

if [[ $missing -ne 0 ]]; then
  echo >&2
  echo "Canonical bridge repo is incomplete." >&2
  exit 1
fi

echo "Bridge workspace verification passed."
echo "  canonical bridge repo: $CANON_BRIDGE"
