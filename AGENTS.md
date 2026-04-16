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
- `deployment/build-checklist.md`
- `deployment/telegram-runtime-migration.md`

## Working Rules

- Canonical source changes land in their owner repo first.
- Do not grow new mirrored Telegram or bridge source trees here.
- Treat this repo as build composition, packaging, and runtime-template
  ownership for the current governed path.
- If the active build path changes, update this repo and
  `platform-engineering` together.

## Validation

- `./deployment/verify-telegram-router-contract.sh`
- `./deployment/verify-bridge-workspace.sh`
- `./deployment/verify-host-control-contract.sh`
- `./deployment/build-openclaw-local.sh`
