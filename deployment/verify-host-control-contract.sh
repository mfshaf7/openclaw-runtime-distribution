#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
PARENT="$(cd -- "$ROOT/.." && pwd)"
PLUGIN_DIR="$ROOT/host-control-openclaw-plugin"
PLUGIN_MANIFEST="$PLUGIN_DIR/contracts/interface-manifest.json"
CANON_BRIDGE="${OPENCLAW_HOST_BRIDGE_REPO:-$PARENT/openclaw-host-bridge}"
BRIDGE_MANIFEST="$CANON_BRIDGE/contracts/interface-manifest.json"

required_paths=(
  "$PLUGIN_DIR"
  "$PLUGIN_MANIFEST"
  "$CANON_BRIDGE"
  "$BRIDGE_MANIFEST"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "Missing required path: $path" >&2
    exit 1
  fi
done

echo "Verifying host-control contract surface"
echo "  plugin repo       : $PLUGIN_DIR"
echo "  plugin manifest   : $PLUGIN_MANIFEST"
echo "  bridge repo       : $CANON_BRIDGE"
echo "  bridge manifest   : $BRIDGE_MANIFEST"
echo

npm --prefix "$PLUGIN_DIR" run test:interface-contract
npm --prefix "$CANON_BRIDGE" run test:interface-contract

python3 - "$PLUGIN_MANIFEST" "$BRIDGE_MANIFEST" <<'PY'
from __future__ import annotations

import json
import sys
from pathlib import Path

plugin_manifest = json.loads(Path(sys.argv[1]).read_text())
bridge_manifest = json.loads(Path(sys.argv[2]).read_text())

errors: list[str] = []

if plugin_manifest.get("schemaVersion") != 1:
    errors.append("plugin manifest schemaVersion must be 1")
if bridge_manifest.get("schemaVersion") != 1:
    errors.append("bridge manifest schemaVersion must be 1")
if plugin_manifest.get("ownerRepo") != "openclaw-runtime-distribution":
    errors.append("unexpected plugin ownerRepo")
if plugin_manifest.get("bridgeOwnerRepo") != "openclaw-host-bridge":
    errors.append("unexpected plugin bridgeOwnerRepo")
if bridge_manifest.get("ownerRepo") != "openclaw-host-bridge":
    errors.append("unexpected bridge ownerRepo")

bridge_stable = {entry["name"] for entry in bridge_manifest.get("stableOperations", [])}
bridge_scaffold = {entry["name"] for entry in bridge_manifest.get("scaffoldOperations", [])}
plugin_tools = plugin_manifest.get("tools", [])
plugin_ops = {
    operation
    for tool in plugin_tools
    for operation in tool.get("bridgeOperations", [])
}

unknown_ops = sorted(plugin_ops - bridge_stable)
if unknown_ops:
    errors.append(f"plugin references non-stable bridge operations: {', '.join(unknown_ops)}")

scaffold_overlap = sorted(plugin_ops & bridge_scaffold)
if scaffold_overlap:
    errors.append(f"plugin still references scaffold-only bridge operations: {', '.join(scaffold_overlap)}")

declared_forbidden = set(plugin_manifest.get("forbiddenBridgeOperations", []))
if declared_forbidden != bridge_scaffold:
    errors.append("plugin forbiddenBridgeOperations must match bridge scaffoldOperations")

full_tool_names = {tool["name"] for tool in plugin_tools}
for forbidden_name in plugin_manifest.get("forbiddenToolNames", []):
    if forbidden_name in full_tool_names:
        errors.append(f"plugin manifest still exposes forbidden tool name {forbidden_name}")

if errors:
    for error in errors:
        print(f"ERROR: {error}")
    sys.exit(1)

print(
    "host-control manifests aligned: "
    f"plugin_tools={len(plugin_tools)} "
    f"bridge_stable_ops={len(bridge_stable)} "
    f"bridge_scaffold_ops={len(bridge_scaffold)}"
)
PY

echo
echo "host-control contract verification passed."
echo "Owner-published manifests and owner-local contract tests are aligned."
