# Build Checklist

Use [operator-build-procedure.md](operator-build-procedure.md) as the primary
operator path. This checklist is supporting verification, not the primary
workflow description.

## Operator workspace
- [ ] Ubuntu WSL installed
- [ ] Ubuntu shell opened and verified
- [ ] Base packages installed
- [ ] Node.js installed through `nvm`
- [ ] Codex CLI installed and verified
- [ ] Workspace created at `~/projects/openclaw-runtime-distribution`

## Target VM
- [ ] VM created
- [ ] VM patched
- [ ] Non-root admin user created
- [ ] Docker installed
- [ ] Compose support verified
- [ ] VM baseline recorded

## OpenClaw deployment
- [ ] Official upstream source recorded (`github.com/openclaw/openclaw`)
- [ ] `.env` created inside target VM
- [ ] Persistent storage path confirmed
- [ ] `OPENCLAW_TELEGRAM_REPO` points at the pinned standalone `openclaw-telegram-enhanced` checkout used for the bundled Telegram packaged-runtime overlay
- [ ] `OPENCLAW_HOST_BRIDGE_REPO` points at the pinned standalone `openclaw-host-bridge` checkout used for validation
- [ ] Owner-published interface manifests are present in the standalone Telegram repo, standalone bridge repo, and the local `host-control-openclaw-plugin/`
- [ ] `./deployment/verify-telegram-router-contract.sh` passes
- [ ] `./deployment/verify-bridge-workspace.sh` passes
- [ ] `./deployment/verify-host-control-contract.sh` passes
- [ ] Telegram and host-control build inputs staged through `./deployment/package-local-plugins.sh`
- [ ] Telegram overlay artifact inputs, when used, staged through `./deployment/package-telegram-overlay.sh`
- [ ] Gateway image built through `./deployment/build-openclaw-local.sh` or an equivalent command path
- [ ] Compiled Telegram runtime present under `/app/extensions/telegram`
- [ ] `TELEGRAM_BOT_TOKEN` remains the packaged Telegram configured-state gate after build
- [ ] Compiled Telegram runtime still exports the runtime hooks needed for monitoring/polling
- [ ] No same-id global Telegram override is present in `/home/node/.openclaw/extensions/telegram`
- [ ] Any Telegram overlay artifact lane still mounts back onto `/app/extensions/telegram`, not a same-id global user-home override
- [ ] Bundled host-control runtime present under `/app/extensions/host-control`
- [ ] Host-control remains registered in the runtime plugin registry
- [ ] Deployment contract mounts `/home/node/.openclaw/media` when Telegram file or screenshot delivery depends on bridge-staged media
- [ ] Host-control permission gates in the distribution package still match the intended stage/prod contract, including any deliberate admin-high-risk enablement
- [ ] `gateway.auth.rateLimit` configured when `gateway.bind` stays beyond loopback
- [ ] Host firewall rules restrict OpenClaw ports if Docker/WSL cannot enforce localhost-only publish safely
- [ ] Startup logs captured
- [ ] Host localhost access confirmed
- [ ] First interaction validated

## Upgrade discipline
- [ ] Official OpenClaw release notes reviewed before changing the base image
- [ ] Telegram/channel/plugin loading changes reviewed specifically
- [ ] Stage Telegram polling and reply validated after every base-image upgrade before prod promotion
- [ ] No undocumented Telegram config keys added just to restore old behavior

## Documentation discipline
- [ ] Deployment issues log updated
- [ ] Deployment guide updated after any method change
- [ ] Formatting checked for consistency
