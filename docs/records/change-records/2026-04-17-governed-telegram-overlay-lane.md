---
security_evidence:
  review_areas:
    - delivery
    - runtime
  workstreams:
    - WS-006
---

# Change Record

## Summary

- Date: 2026-04-17
- Short title: Telegram overlay artifact lane became a governed runtime delivery path
- Environment: stage and prod delivery model
- Severity: medium

## Classification

- Type: deployment/artifact bug
- User-facing impact: small Telegram-only fixes previously required a full
  gateway rebuild even when the OpenClaw base stayed qualified, which slowed
  repair and encouraged over-coupling between channel fixes and base image
  rollout.

## Ownership

- Owning repo or layer: `openclaw-runtime-distribution`
- Related repos: `platform-engineering`, `openclaw-telegram-enhanced`

## Root Cause

- Immediate failure: the existing delivery model only recognized the full
  gateway image as a governed runtime artifact.
- Actual root cause: Telegram packaging already existed as a discrete seam, but
  the distribution repo did not publish it as a supported immutable artifact
  lane that platform contracts could pin independently.
- Why it escaped earlier controls: the build path was reproducible, but the
  artifact granularity remained too coarse for frequent Telegram-only fixes.

## Source Changes

- Repo: `openclaw-runtime-distribution`
- Commit(s): `7c883924`
- Guardrail added:
  - documented the Telegram overlay as a governed artifact lane on a qualified
    OpenClaw base
  - kept overlay packaging tied to the same `npm pack` allowlist and owner
    contract checks used by the bundled runtime path

## Artifact And Deployment Evidence

- Packaged artifact: `ghcr.io/mfshaf7/openclaw-telegram-overlay`
- Related platform or release evidence:
  `platform-engineering/docs/decisions/adr/ADR-009-governed-telegram-overlay-artifact-lane.md`
- Build or workflow evidence: the overlay build path installs Telegram
  dependencies before contract validation and publishes a digest-pinned artifact
  for stage rehearsal and governed prod promotion

## Live Verification

- Validation:
  - `./deployment/package-telegram-overlay.sh`
  - `./deployment/verify-telegram-router-contract.sh`
  - `./deployment/verify-host-control-contract.sh`
- Runtime or stage evidence:
  - the overlay lane was rehearsed on stage and proved normal reply, file
    delivery, screenshot delivery, and privileged-path posture on the qualified
    base gateway image
- Residual risk: any future OpenClaw base change still requires fresh
  qualification before Telegram-only fixes should rely on the overlay lane.

## Follow-Up

- Required follow-up: keep Telegram overlay packaging compatible with the
  published Telegram and bridge interface contracts on every packaging change.
- Optional hardening: add explicit compatibility metadata if the overlay lane
  eventually needs stricter base-version negotiation.
- Owner: Runtime distribution maintainers
