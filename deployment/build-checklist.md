# Build Checklist

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
- [ ] `./deployment/verify-telegram-router-contract.sh` passes
- [ ] `./deployment/verify-bridge-workspace.sh` passes
- [ ] `./deployment/verify-host-control-contract.sh` passes
- [ ] Telegram and host-control build inputs staged through `./deployment/package-local-plugins.sh`
- [ ] Gateway image built through `./deployment/build-openclaw-local.sh` or an equivalent command path
- [ ] Compiled Telegram runtime present under `/app/dist/extensions/telegram`
- [ ] `TELEGRAM_BOT_TOKEN` remains the packaged Telegram configured-state gate after build
- [ ] Compiled Telegram runtime still exports the runtime hooks needed for monitoring/polling
- [ ] No same-id global Telegram override is present in `/home/node/.openclaw/extensions/telegram`
- [ ] Bundled host-control runtime present under `/app/extensions/host-control`
- [ ] Host-control remains registered in the runtime plugin registry
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
