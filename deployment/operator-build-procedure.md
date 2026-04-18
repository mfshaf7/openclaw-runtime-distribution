# Operator Build Procedure

This is the primary operator-facing build and packaging procedure for
`openclaw-runtime-distribution`.

Use it when you need to know:

- which command path is the normal one
- when to use the Telegram overlay lane instead of the full gateway build
- when a packaging script is only a staging helper
- how this repo hands off into the governed platform path

The checklist and migration docs remain supporting references. They are not the
primary operator path.

## 1. Choose The Correct Lane

There are three operator-relevant command paths here.

### A. Normal full gateway image build

Use this when you are qualifying the complete governed runtime composition:

```bash
./deployment/build-openclaw-local.sh
```

What it does:

- stages bundled Telegram and host-control plugin inputs
- verifies the Telegram router, bridge workspace, and host-control contract
- builds the gateway image from the configured base image

This is the default operator path for the full runtime.

### B. Bundled plugin staging only

Use this only when you need to inspect or refresh the staged runtime inputs
without building the final image yet:

```bash
./deployment/package-local-plugins.sh
```

This is a helper path, not the normal final operator action. The full gateway
build already calls it automatically.

### C. Telegram-only overlay artifact lane

Use this only for the separate immutable Telegram overlay flow:

```bash
./deployment/package-telegram-overlay.sh
```

This is for small Telegram-only changes that are meant to run against an
already-qualified OpenClaw base image.

Do not use this lane as a shortcut for arbitrary runtime changes.

## 2. Prerequisites Before Any Build

Before running any lane:

- confirm the standalone Telegram source repo is available through
  `OPENCLAW_TELEGRAM_REPO` or the default sibling checkout
- confirm the canonical bridge source repo is available through
  `OPENCLAW_HOST_BRIDGE_REPO` or the default sibling checkout used by the
  verification scripts
- confirm the local `host-control-openclaw-plugin/` copy is present
- confirm owner-published interface manifests exist in the source repos

Supporting checklist:

- [build-checklist.md](build-checklist.md)

## 3. Default Full Build Procedure

When you need the full runtime image:

1. review the supporting checklist in [build-checklist.md](build-checklist.md)
2. run:

```bash
./deployment/build-openclaw-local.sh
```

3. verify the script completed the contract checks and produced the image tag
4. if the build output is intended to become a governed candidate, carry the
   resulting source SHAs and image output into `platform-engineering`

Important detail:

- `build-openclaw-local.sh` already runs `package-local-plugins.sh`
- do not run both out of habit unless you explicitly want to inspect the staged
  bundled inputs first

## 4. Telegram Overlay Procedure

When you need only the Telegram overlay artifact:

1. confirm the change is Telegram-only
2. run:

```bash
./deployment/package-telegram-overlay.sh
```

3. confirm the staged overlay files were produced under
   `deployment/.build/telegram-overlay/`
4. remember that this artifact is only valid for the same qualified OpenClaw
   base image recorded by `platform-engineering`

Supporting rationale:

- [telegram-runtime-migration.md](telegram-runtime-migration.md)

## 5. Supporting Verification Commands

Use these directly when debugging or verifying one seam in isolation:

```bash
./deployment/verify-telegram-router-contract.sh
./deployment/verify-bridge-workspace.sh
./deployment/verify-host-control-contract.sh
```

These are supporting checks. They do not replace the primary operator
procedures above.

## 6. What This Repo Does Not Finish

This repo builds and stages candidate artifacts. It does not approve or deploy
them into governed environments.

After a successful local build or overlay package:

- move the winning source changes through normal review
- record the approved digest and SHAs in `platform-engineering`
- use the governed stage/prod flow there for actual environment rollout

## Related Docs

- [build-checklist.md](build-checklist.md)
- [telegram-runtime-migration.md](telegram-runtime-migration.md)
- [`platform-engineering/docs/runbooks/rebuild-and-promote-gateway.md`](https://github.com/mfshaf7/platform-engineering/blob/main/docs/runbooks/rebuild-and-promote-gateway.md)
