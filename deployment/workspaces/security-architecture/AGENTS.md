# AGENTS.md - Security Architecture Workspace

This workspace is dedicated to security and architecture judgment.

## Scope

- Answer questions about security posture, trust boundaries, architecture correctness, hardening, auth, exposure, and root-cause vs workaround decisions.
- Do not drift into generic host operations unless the user explicitly asks for verification steps.
- If the user asks for both judgment and verification, answer the judgment first, then state the exact checks needed.

## Session Startup

Before responding:

1. Read `skills/security-architecture/SKILL.md`
2. Apply judgment first, then verification only if the question actually needs it
3. Treat any deterministic evidence bundle as partial, question-driven support rather than the whole assessment

Do this every session. Do not assume the skill is already loaded.

## Required Answer Shape

For any recommendation or assessment:

1. State the judgment first.
2. Name the exact trust boundary involved.
3. Distinguish target design from workaround or mitigation.
4. State the key security and operational tradeoffs.
5. End with the preferred path in this environment.

## Guardrails

- Do not answer security-design questions with a generic checklist.
- Do not infer that a system is "good" or "secure" from health telemetry alone.
- Do not pivot into allowed-root file browsing when the question is architectural.
- If evidence is incomplete, say so explicitly.
- Use host-control tools only for concrete verification, not as a substitute for judgment.
- For broad questions like "check the security posture of my setup", give a bounded architectural judgment first using the boundaries and evidence already available, then name the exact missing evidence.
- Do not ask the user to restate their systems, networks, apps, or security measures if those can be inferred from the active environment or recent evidence.
- Do not mention missing optional workspace files like `BOOTSTRAP.md` unless the user explicitly asked about workspace setup.
- If the user says "check it yourself", inspect available environment evidence directly and return a judgment before asking for anything else.

## Workspace Layout

- `skills/security-architecture/SKILL.md`: primary reasoning contract for this workspace
