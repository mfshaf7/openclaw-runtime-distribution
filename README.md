# OpenClaw Runtime Distribution

This repository is the thin distribution layer for your OpenClaw runtime.

It assembles a reproducible gateway image from pinned upstream repos without carrying copied Telegram or bridge source trees inside the repo.

## What belongs here

- bundled Telegram packaged-runtime overlay inputs
- host-control packaged plugin build inputs
- runtime-facing workspace templates
- build and operator checklists
- upgrade and migration notes for packaged Telegram/runtime seams

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

- `openclaw-telegram-enhanced` remains a publishable plugin package, but its runtime behavior is delivered through the bundled packaged Telegram seam in the gateway image
- `host-control-openclaw-plugin` remains a publishable plugin package and is staged from its packlist into the deterministic bundled runtime seam
- `openclaw-host-bridge` stays standalone and is only validated through contract checks
- `openclaw-runtime-distribution` owns the build and distribution path

## Supported Telegram runtime seam

The supported seam for your current OpenClaw deployment is the packaged bundled Telegram runtime under `/app/dist/extensions/telegram`.

That means:

- we do not rely on a same-id global `telegram` override
- we do not rely on undocumented Telegram config keys
- we do not rely on copied Telegram source trees living in deployment repos
- we verify the compiled Telegram runtime contract in CI after every OpenClaw base-image update

## Build flow

1. Validate the pinned Telegram and bridge repos.
2. Stage the Telegram overlay inputs and host-control package inputs.
3. Build a gateway image that keeps Telegram and host-control on the deterministic bundled runtime seam.
4. Run runtime smoke checks that validate the compiled Telegram contract and the host-control plugin registry.
5. Keep the resulting image reproducible by pinning the source SHAs in GitOps.

## Start here

- [deployment/build-checklist.md](deployment/build-checklist.md)
- [deployment/telegram-runtime-migration.md](deployment/telegram-runtime-migration.md)
- [deployment/build-openclaw-local.sh](deployment/build-openclaw-local.sh)
- [deployment/package-local-plugins.sh](deployment/package-local-plugins.sh)
- [deployment/Dockerfile.plugin-install.example](deployment/Dockerfile.plugin-install.example)
