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
- [ ] `OPENCLAW_TELEGRAM_REPO` points at the pinned standalone `openclaw-telegram-enhanced` checkout used for the bundled Telegram overlay
- [ ] `OPENCLAW_HOST_BRIDGE_REPO` points at the pinned standalone `openclaw-host-bridge` checkout used for validation
- [ ] `./deployment/verify-telegram-router-contract.sh` passes
- [ ] `./deployment/verify-bridge-workspace.sh` passes
- [ ] `./deployment/verify-host-control-contract.sh` passes
- [ ] Telegram and host-control packlists staged into `deployment/.build/bundled-plugins/` through `./deployment/package-local-plugins.sh`
- [ ] Gateway image built through `./deployment/build-openclaw-local.sh` or an equivalent command path
- [ ] Bundled Telegram overlay applied in `/app/extensions/telegram`
- [ ] Bundled host-control overlay applied in `/app/extensions/host-control`
- [ ] `OPENCLAW_BUNDLED_PLUGINS_DIR=/app/extensions` set in the image runtime
- [ ] `gateway.auth.rateLimit` configured when `gateway.bind` stays beyond loopback
- [ ] Host firewall rules restrict OpenClaw ports if Docker/WSL cannot enforce localhost-only publish safely
- [ ] Startup logs captured
- [ ] Host localhost access confirmed
- [ ] First interaction validated

## Documentation discipline
- [ ] Deployment issues log updated
- [ ] Deployment guide updated after any method change
- [ ] Formatting checked for consistency
