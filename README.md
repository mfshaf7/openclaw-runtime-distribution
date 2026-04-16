# OpenClaw Runtime Distribution

`openclaw-runtime-distribution` is the active stage/prod runtime composition
repository for the current governed gateway build path.

It assembles a reproducible gateway image from pinned upstream repos without
carrying copied Telegram or bridge source trees as long-lived hidden forks.

## What This Repository Owns

This repository owns:

- current bundled runtime assembly inputs
- packaged Telegram runtime seam integration
- Telegram-only overlay artifact packaging for stage qualification and governed
  prod promotion on a qualified base
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
3. Verification scripts confirm the bundled runtime contract against
   owner-published interface manifests.
4. The resulting gateway or Telegram overlay artifact is built and
   published through the governed platform workflow.
5. `platform-engineering` records the approved digest, SHAs, and when needed
   the qualified OpenClaw base image that the overlay lane is allowed to run
   against.

## Supported Telegram Runtime Seam

The supported seam for the current deployment model is the packaged bundled
Telegram runtime under `/app/extensions/telegram`.

That means:

- no same-id global Telegram override recovery path
- no undocumented Telegram config keys as a compatibility crutch
- no copied Telegram source tree hidden inside the build repo
- every OpenClaw base-image update requires contract verification against the
  packaged runtime seam

For small Telegram-only fixes, the same packaged Telegram overlay may also be
delivered as a separate immutable artifact and mounted back onto the bundled
runtime path. That lane must remain:

- pinned by digest in `platform-engineering`
- stage-qualified before any prod use
- promoted to prod only on the same qualified OpenClaw base image
- sourced from the same `npm pack` allowlist used for the bundled gateway image

## Audit And Visibility

This repo’s main evidence surfaces are build-time and contract-time rather than
runtime metrics.

- packaging and contract checks:
  - `deployment/verify-telegram-router-contract.sh`
  - `deployment/verify-bridge-workspace.sh`
  - `deployment/verify-host-control-contract.sh`
  - `deployment/package-telegram-overlay.sh`
- owner-published interface manifests:
  - `openclaw-telegram-enhanced/contracts/interface-manifest.json`
  - `openclaw-host-bridge/contracts/interface-manifest.json`
  - `host-control-openclaw-plugin/contracts/interface-manifest.json`
- build procedure and requirements:
  - [deployment/build-checklist.md](deployment/build-checklist.md)
- migration and seam rationale:
  - [deployment/telegram-runtime-migration.md](deployment/telegram-runtime-migration.md)
- final deployment evidence:
  - source SHAs and digests recorded in `platform-engineering`

## Security References

- [`security-architecture/docs/architecture/components/openclaw-runtime-distribution/README.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/architecture/components/openclaw-runtime-distribution/README.md)
- [`security-architecture/docs/architecture/products/openclaw/required-controls.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/architecture/products/openclaw/required-controls.md)
- [`security-architecture/docs/architecture/domains/gitops-and-machine-trust.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/architecture/domains/gitops-and-machine-trust.md)
- [`security-architecture/docs/reviews/security-review-checklist.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/reviews/security-review-checklist.md)
- [`security-architecture/docs/reviews/components/README.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/reviews/components/README.md)

## Governance Rules

- Canonical source changes should land in their owner repo first.
- This repo should stage those sources through supported packaging paths, not by
  growing new mirrored source trees.
- Contract verification here should consume owner-published manifests and
  owner-local contract tests rather than grepping private source text.
- If the active build path changes, this README and the platform standards
  should say so explicitly.
- If a runtime contract change requires new operator validation, document it in
  the build checklist and platform runbooks.

## Start Here

- [deployment/build-checklist.md](deployment/build-checklist.md)
- [deployment/telegram-runtime-migration.md](deployment/telegram-runtime-migration.md)
- `deployment/build-openclaw-local.sh`
- `deployment/package-local-plugins.sh`
- security review surfaces:
  - [`security-architecture/docs/architecture/components/openclaw-runtime-distribution/README.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/architecture/components/openclaw-runtime-distribution/README.md)
  - [`security-architecture/docs/architecture/products/openclaw/required-controls.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/architecture/products/openclaw/required-controls.md)
  - [`security-architecture/docs/architecture/domains/gitops-and-machine-trust.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/architecture/domains/gitops-and-machine-trust.md)
  - [`security-architecture/docs/reviews/security-review-checklist.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/reviews/security-review-checklist.md)
  - [`security-architecture/docs/reviews/components/README.md`](https://github.com/mfshaf7/security-architecture/blob/main/docs/reviews/components/README.md)

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
