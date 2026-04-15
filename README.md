# OpenClaw Runtime Distribution

This repository is the thin distribution layer for your OpenClaw runtime.

It assembles a reproducible gateway image from pinned upstream repos without carrying copied Telegram or bridge source trees inside the repo.

## What belongs here

- managed-plugin image assembly scripts
- the local `host-control-openclaw-plugin`
- runtime-facing workspace templates
- build and operator checklists

## What does not belong here

- copied `openclaw-telegram-enhanced` source
- copied `openclaw-host-bridge` source
- mirrored runtime code kept only for image assembly

## Workspace layout

```text
~/projects/
|-- openclaw-runtime-distribution/
|-- openclaw-telegram-enhanced/
`-- openclaw-host-bridge/
```

In this model:

- `openclaw-telegram-enhanced` is packaged directly from `OPENCLAW_TELEGRAM_REPO`
- `openclaw-host-bridge` stays standalone and is only validated through contract checks
- `openclaw-runtime-distribution` owns the build/distribution path

## Build flow

1. Validate the pinned Telegram and bridge repos.
2. Package Telegram and host-control as managed plugin artifacts with `npm pack`.
3. Build a gateway image that installs those artifacts through `openclaw plugins install`.
4. Keep the resulting image reproducible by pinning the source SHAs in GitOps.

## Start here

- [deployment/build-checklist.md](deployment/build-checklist.md)
- [deployment/build-openclaw-local.sh](deployment/build-openclaw-local.sh)
- [deployment/package-local-plugins.sh](deployment/package-local-plugins.sh)
- [deployment/Dockerfile.plugin-install.example](deployment/Dockerfile.plugin-install.example)
