# Telegram Runtime Migration Notes

## Why this exists

Recent OpenClaw releases tightened:

- bundled/plugin loading and activation scope
- packaged channel runtime dependency staging
- config validation for channel/plugin keys

That made the older Telegram customization strategy too brittle. The old setup worked because it effectively replaced bundled Telegram behavior in the runtime image. Newer OpenClaw builds are stricter about how Telegram is packaged, discovered, and validated.

## Current supported strategy

For this deployment, Telegram customization is supported through the packaged bundled runtime seam:

- runtime location: `/app/extensions/telegram`
- token contract: `TELEGRAM_BOT_TOKEN`
- config contract: documented Telegram config keys only
- distribution repo responsibility: overlay and verify the packaged runtime, not a same-id global plugin override

## Stage-only experiment seam

To reduce the cost of small Telegram-only fixes during stage rehearsal, the
same packaged overlay can be delivered as a separate immutable artifact and
mounted back onto the bundled runtime path:

- packaged overlay source: `deployment/.build/telegram-overlay/telegram`
- artifact packager: `deployment/package-telegram-overlay.sh`
- runtime destination: `/app/extensions/telegram`
- delivery model: stage-only init-container copy into a shared volume

This is an experiment in artifact granularity, not permission to reintroduce a
same-id global Telegram override or mutable runtime patching.

## Explicitly unsupported assumptions

Do not rely on:

- a same-id global `telegram` plugin override
- undocumented keys like `channels.telegram.botTokenEnv`
- copied Telegram source trees living forever in deployment repos
- OpenClaw silently auto-migrating old Telegram config forever

## Required build/runtime checks

Every OpenClaw base-image update must prove:

1. the compiled Telegram runtime exists under `/app/extensions/telegram`
2. `configured-state.js` still gates on `TELEGRAM_BOT_TOKEN`
3. `openclaw.plugin.json` still advertises the Telegram channel and env var contract
4. `runtime-api.js` still exports the bundled Telegram runtime hooks
5. host-control still registers in the runtime plugin registry
6. stage Telegram polling and reply still work before prod promotion

## Practical migration rule

If an OpenClaw update breaks Telegram again:

1. read the official OpenClaw release notes first
2. inspect the compiled Telegram runtime in the built image
3. fix the distribution seam or runtime contract test
4. do not paper over the break with undocumented config keys

## When upstreaming becomes reasonable

Only upstream the Telegram customization when the behavior is:

- stable
- minimal
- generic beyond this deployment
- no longer dependent on private deployment assumptions
