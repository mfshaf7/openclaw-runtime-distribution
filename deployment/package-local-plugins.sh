#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
PARENT="$(cd -- "$ROOT/.." && pwd)"
ARTIFACT_DIR="${OPENCLAW_PLUGIN_ARTIFACTS_DIR:-$ROOT/deployment/.build/plugin-artifacts}"
TELEGRAM_PLUGIN_ROOT="${OPENCLAW_TELEGRAM_REPO:-$PARENT/openclaw-telegram-enhanced}"
HOST_CONTROL_PLUGIN_ROOT="$ROOT/host-control-openclaw-plugin"

mkdir -p "$ARTIFACT_DIR"
rm -f "$ARTIFACT_DIR"/*.tgz

if [[ ! -d "$TELEGRAM_PLUGIN_ROOT" ]]; then
  echo "Missing Telegram plugin source repo: $TELEGRAM_PLUGIN_ROOT" >&2
  exit 1
fi

if [[ ! -d "$HOST_CONTROL_PLUGIN_ROOT" ]]; then
  echo "Missing host-control plugin source repo: $HOST_CONTROL_PLUGIN_ROOT" >&2
  exit 1
fi

"$ROOT/deployment/verify-telegram-router-contract.sh" "$ROOT"
"$ROOT/deployment/verify-bridge-workspace.sh" "$ROOT"
"$ROOT/deployment/verify-host-control-contract.sh" "$ROOT"

echo
echo "Packaging managed OpenClaw plugins from pinned source repos..."
echo "  telegram source : $TELEGRAM_PLUGIN_ROOT"
echo "  host-control    : $HOST_CONTROL_PLUGIN_ROOT"
echo "  output dir      : $ARTIFACT_DIR"

plugins=(
  "$TELEGRAM_PLUGIN_ROOT"
  "$HOST_CONTROL_PLUGIN_ROOT"
)

assert_packlist_is_publishable() {
  local plugin_root="$1"
  local pack_manifest
  pack_manifest="$(cd "$plugin_root" && npm pack --json --dry-run)"
  PACK_MANIFEST="$pack_manifest" python3 - "$plugin_root" <<'PACKJSON'
import json
import os
import sys

plugin_root = sys.argv[1]
entries = json.loads(os.environ["PACK_MANIFEST"])
if not entries:
    raise SystemExit(f"npm pack --json --dry-run returned no entries for {plugin_root}")
files = [item.get('path', '') for item in entries[0].get('files', [])]
disallowed = sorted(
    path for path in files
    if path.startswith('test/')
    or '/test/' in path
    or path.startswith('__tests__/')
    or '.test.' in path
    or '.test-' in path
    or 'test-support' in path
    or 'test-utils' in path
    or 'fixture-test-support' in path
    or 'e2e-harness' in path
    or path.endswith('.d.ts')
)
if disallowed:
    print(f"Managed plugin packlist for {plugin_root} includes non-runtime files:", file=sys.stderr)
    for path in disallowed:
        print(f"- {path}", file=sys.stderr)
    raise SystemExit(1)
PACKJSON
}

for plugin_root in "${plugins[@]}"; do
  if [[ ! -f "$plugin_root/package.json" ]]; then
    echo "Missing package.json for plugin package: $plugin_root" >&2
    exit 1
  fi
  assert_packlist_is_publishable "$plugin_root"
  (cd "$plugin_root" && npm pack --pack-destination "$ARTIFACT_DIR" >/dev/null)
done

echo "Packaged plugin artifacts:"
find "$ARTIFACT_DIR" -maxdepth 1 -type f -name '*.tgz' -printf '  %f\n' | sort
