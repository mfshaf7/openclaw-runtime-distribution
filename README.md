# OpenClaw Runtime Distribution

`openclaw-runtime-distribution` is the active stage/prod runtime composition
repository for the current governed gateway build path.

It assembles a reproducible gateway image from pinned upstream repos without
carrying copied Telegram or bridge source trees as long-lived hidden forks.

## What This Repository Owns

This repository owns:

- current bundled runtime assembly inputs
- packaged Telegram runtime seam integration
- active `host-control-openclaw-plugin` package copy for stage/prod
- runtime-required workspace templates for the governed image
- distribution-specific verification and packaging scripts

It does not own:

- Telegram canonical source
- bridge canonical source
- environment approval or digest recording
- Argo deployment state

## Current Workflow Role

1. Canonical source repos are updated:
   - `openclaw-telegram-enhanced`
   - `openclaw-host-bridge`
   - active plugin owner in this repo
2. This repo stages the required packaged runtime inputs.
3. Verification scripts confirm the bundled runtime contract.
4. The resulting artifact is built and published through the governed platform
   workflow.
5. `platform-engineering` records the approved digest and SHAs.

## Supported Telegram Runtime Seam

The supported seam for the current deployment model is the packaged bundled
Telegram runtime under `/app/dist/extensions/telegram`.

That means:

- no same-id global Telegram override recovery path
- no undocumented Telegram config keys as a compatibility crutch
- no copied Telegram source tree hidden inside the build repo
- every OpenClaw base-image update requires contract verification against the
  packaged runtime seam

## Audit And Visibility

This repo’s main evidence surfaces are build-time and contract-time rather than
runtime metrics.

- packaging and contract checks:
  - `deployment/verify-telegram-router-contract.sh`
  - `deployment/verify-bridge-workspace.sh`
  - `deployment/verify-host-control-contract.sh`
- build procedure and requirements:
  - [deployment/build-checklist.md](deployment/build-checklist.md)
- migration and seam rationale:
  - [deployment/telegram-runtime-migration.md](deployment/telegram-runtime-migration.md)
- final deployment evidence:
  - source SHAs and digests recorded in `platform-engineering`

## Governance Rules

- Canonical source changes should land in their owner repo first.
- This repo should stage those sources through supported packaging paths, not by
  growing new mirrored source trees.
- If the active build path changes, this README and the platform standards
  should say so explicitly.
- If a runtime contract change requires new operator validation, document it in
  the build checklist and platform runbooks.

## Start Here

- [deployment/build-checklist.md](deployment/build-checklist.md)
- [deployment/telegram-runtime-migration.md](deployment/telegram-runtime-migration.md)
- `deployment/build-openclaw-local.sh`
- `deployment/package-local-plugins.sh`

## Relationship To Other Repositories

- `openclaw-telegram-enhanced`
  - canonical Telegram source
- `openclaw-host-bridge`
  - canonical host enforcement source
- `platform-engineering`
  - release authority, environment approval, and platform-side OpenClaw
    architecture and owner model
- `security-architecture`
  - OpenClaw security architecture and trust-boundary judgment
