#!/usr/bin/env python3
"""Validate repo-local documentation doctrine for openclaw-runtime-distribution."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


REQUIRED_RELATED_REPOS = (
    "openclaw-telegram-enhanced",
    "openclaw-host-bridge",
    "platform-engineering",
    "security-architecture",
)
REQUIRED_README_MARKERS = (
    "/app/extensions/telegram",
    "no same-id global Telegram override recovery path",
    "no copied Telegram source tree hidden inside the build repo",
    "host-control-openclaw-plugin/contracts/interface-manifest.json",
)
REQUIRED_OPERATOR_PROCEDURE_MARKERS = (
    "primary operator-facing build and packaging procedure",
    "### A. Normal full gateway image build",
    "### B. Bundled plugin staging only",
    "### C. Telegram-only overlay artifact lane",
    "These are supporting checks. They do not replace the primary operator\nprocedures above.",
)
REQUIRED_MIGRATION_MARKERS = (
    "runtime location: `/app/extensions/telegram`",
    "- a same-id global `telegram` plugin override",
    "- copied Telegram source trees living forever in deployment repos",
    "delivery model: init-container copy into a shared volume, qualified on stage,",
)
REQUIRED_PLUGIN_MARKERS = (
    "This distribution-scoped plugin package must stay capability-compatible with the\nactive deployment contract.",
    "- `openclaw-host-bridge`",
    "- `openclaw-telegram-enhanced`",
    "- `openclaw-runtime-distribution`",
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require_markers(errors: list[str], path: Path, markers: tuple[str, ...]) -> None:
    if not path.exists():
        errors.append(f"{path}: missing required documentation file")
        return
    text = read_text(path)
    missing = [marker for marker in markers if marker not in text]
    if missing:
        errors.append(f"{path}: missing required markers: {', '.join(missing)}")


def validate_readme(errors: list[str], repo_root: Path) -> None:
    readme_path = repo_root / "README.md"
    if not readme_path.exists():
        errors.append(f"{readme_path}: missing repo README")
        return
    text = read_text(readme_path)
    for repo_name in REQUIRED_RELATED_REPOS:
        if f"`{repo_name}`" not in text:
            errors.append(f"{readme_path}: missing related repo entry for `{repo_name}`")
    missing = [marker for marker in REQUIRED_README_MARKERS if marker not in text]
    if missing:
        errors.append(f"{readme_path}: missing runtime doctrine markers: {', '.join(missing)}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate openclaw-runtime-distribution repo-local documentation doctrine."
    )
    parser.add_argument(
        "--repo-root",
        default=Path(__file__).resolve().parents[1],
        type=Path,
        help="openclaw-runtime-distribution repository root",
    )
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    errors: list[str] = []
    validate_readme(errors, repo_root)
    require_markers(
        errors,
        repo_root / "deployment" / "operator-build-procedure.md",
        REQUIRED_OPERATOR_PROCEDURE_MARKERS,
    )
    require_markers(
        errors,
        repo_root / "deployment" / "telegram-runtime-migration.md",
        REQUIRED_MIGRATION_MARKERS,
    )
    require_markers(
        errors,
        repo_root / "host-control-openclaw-plugin" / "README.md",
        REQUIRED_PLUGIN_MARKERS,
    )

    if errors:
        raise SystemExit("\n".join(errors))

    print("openclaw-runtime-distribution repo docs valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
