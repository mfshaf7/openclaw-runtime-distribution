#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
PARENT="$(cd -- "$ROOT/.." && pwd)"
CANON_TELEGRAM="${OPENCLAW_TELEGRAM_REPO:-$PARENT/openclaw-telegram-enhanced}"
TELEGRAM_MANIFEST="$CANON_TELEGRAM/contracts/interface-manifest.json"
TELEGRAM_PACKAGE="$CANON_TELEGRAM/package.json"

required_paths=(
  "$CANON_TELEGRAM"
  "$TELEGRAM_MANIFEST"
  "$TELEGRAM_PACKAGE"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "Missing required path: $path" >&2
    exit 1
  fi
done

echo "Verifying Telegram host-control router contract"
echo "  Telegram repo    : $CANON_TELEGRAM"
echo "  interface manifest: $TELEGRAM_MANIFEST"
echo

npm --prefix "$CANON_TELEGRAM" run test:host-control-contract

python3 - "$TELEGRAM_MANIFEST" <<'PY'
from __future__ import annotations

import json
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
manifest = json.loads(manifest_path.read_text())
routing = manifest.get("hostControlReadRouting", {})

errors: list[str] = []
if manifest.get("schemaVersion") != 1:
    errors.append("schemaVersion must be 1")
if manifest.get("contractId") != "openclaw-telegram-host-control-router.v1":
    errors.append("unexpected contractId")
if manifest.get("ownerRepo") != "openclaw-telegram-enhanced":
    errors.append("unexpected ownerRepo")

prefixes = routing.get("callbackPrefixes", {})
if prefixes.get("proceed") != "pcctl:proceed:":
    errors.append("missing proceed callback prefix")
if prefixes.get("cancel") != "pcctl:cancel:":
    errors.append("missing cancel callback prefix")

if set(routing.get("blockedConversationalTriggers", [])) != {"what about", "how about"}:
    errors.append("blocked conversational triggers drifted")

required_escape_phrases = {"answer normally", "just answer", "no tools", "don't use tools"}
if set(routing.get("escapePhrases", [])) != required_escape_phrases:
    errors.append("escape phrase contract drifted")

for key in (
    "guardsGenericFindQueryBehindHostScope",
    "resolvesPersistedProposalCallbacksById",
    "clearsButtonsAfterDirectReadExecution",
):
    if routing.get(key) is not True:
        errors.append(f"{key} must remain true")

if errors:
    for error in errors:
        print(f"ERROR: {error}")
    sys.exit(1)

print(
    "telegram router manifest valid: "
    f"callbacks={sorted(prefixes.keys())} "
    f"escapes={len(routing.get('escapePhrases', []))} "
    f"blocked_triggers={len(routing.get('blockedConversationalTriggers', []))}"
)
PY

echo "Telegram router contract verification passed."
echo "Owner-published manifest and owner-local router contract test are aligned."
