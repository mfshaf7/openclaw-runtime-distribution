# openclaw-runtime-distribution Agent Notes

This repository is the active stage/prod runtime composition path for the
current governed OpenClaw gateway build.

## What This Repo Owns

- current bundled runtime assembly inputs
- packaged Telegram runtime seam integration
- active stage/prod `host-control-openclaw-plugin` package copy
- runtime-required workspace templates for the governed image
- distribution-specific verification and packaging scripts

It does not own canonical Telegram source, canonical bridge source, or platform
promotion state.

## Read First

- `README.md`
- `deployment/operator-build-procedure.md`
- `deployment/build-checklist.md`
- `deployment/telegram-runtime-migration.md`
- `docs/records/change-records/README.md`
- `security-architecture/docs/architecture/components/openclaw-runtime-distribution/README.md`
- `security-architecture/docs/architecture/products/openclaw/required-controls.md`
- `security-architecture/docs/architecture/domains/gitops-and-machine-trust.md`
- `security-architecture/docs/reviews/security-review-checklist.md`
- `security-architecture/docs/reviews/components/2026-04-18-openclaw-runtime-distribution-security-baseline.md`

## Working Rules

- Canonical source changes land in their owner repo first.
- Do not grow new mirrored Telegram or bridge source trees here.
- Treat this repo as build composition, packaging, and runtime-template
  ownership for the current governed path.
- If the active build path changes, update this repo and
  `platform-engineering` together.

## Review guidelines

For Codex GitHub review, treat the following as `P1` when they plausibly
regress the governed runtime composition path:

- copied-source drift or new mirrored Telegram or bridge source appearing here
  instead of in the canonical owner repo
- runtime seam or packaging changes that bypass the declared verification scripts
  or skip required platform-engineering coordination when the active
  build path changes
- change-record or runtime-evidence regressions that would let a distribution
  change land without reviewable governed evidence

## Validation

- `python3 scripts/validate_repo_docs.py --repo-root .`
- `./deployment/verify-telegram-router-contract.sh`
- `./deployment/verify-bridge-workspace.sh`
- `./deployment/verify-host-control-contract.sh`
- `./deployment/package-telegram-overlay.sh`
- `./deployment/build-openclaw-local.sh`
- `python3 scripts/validate_governance_docs.py --repo-root .` when change-record evidence changes
- `python3 scripts/validate_change_record_requirement.py --repo-root . --against-ref origin/main` for PR-shaped distribution changes that should emit a security-tagged change record
