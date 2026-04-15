#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
PARENT="$(cd -- "$ROOT/.." && pwd)"
CANON_TELEGRAM="${OPENCLAW_TELEGRAM_REPO:-$PARENT/openclaw-telegram-enhanced}"
CANON_ROUTER="$CANON_TELEGRAM/src/bot-message-dispatch.host-control.ts"

search() {
  local pattern="$1"
  shift
  grep -nE "$pattern" "$@"
}

if [[ ! -f "$CANON_ROUTER" ]]; then
  echo "Missing required router file: $CANON_ROUTER" >&2
  exit 1
fi

echo "Verifying Telegram host-control router contract"
echo "  source router: $CANON_ROUTER"
echo

if search 'what about|how about' "$CANON_ROUTER" >/dev/null; then
  echo "Router still contains overly broad conversational host-control triggers." >&2
  exit 1
fi

if ! search "answer normally|just answer|no tools?|don't use (pc-?control|tools?)" "$CANON_ROUTER" >/dev/null; then
  echo "Router is missing non-host-control escape phrases." >&2
  exit 1
fi

if ! grep -F 'looksLikeHostScopedFindText(normalized)' "$CANON_ROUTER" >/dev/null; then
  echo "Router no longer checks for host-scoped find intent." >&2
  exit 1
fi

if ! grep -F 'extractGeneralQuery(normalized)' "$CANON_ROUTER" >/dev/null; then
  echo "Router no longer guards generic find/search behind host-scoped intent." >&2
  exit 1
fi

if ! grep -F 'loadDirectReadProposalById(params.sessionKey, params.proposalId)' "$CANON_ROUTER" >/dev/null; then
  echo "Router no longer resolves persisted direct-read proposals from button callbacks." >&2
  exit 1
fi

if ! grep -F 'await params.clearButtons();' "$CANON_ROUTER" >/dev/null; then
  echo "Router no longer clears Proceed/Cancel buttons after direct-read execution." >&2
  exit 1
fi

if ! search 'pcctl:proceed:|pcctl:cancel:' "$CANON_ROUTER" >/dev/null; then
  echo "Router is missing deterministic Proceed/Cancel button callbacks." >&2
  exit 1
fi

echo "Telegram router contract verification passed."
echo "Generic chat escapes remain available and broad conversational triggers stay blocked."
