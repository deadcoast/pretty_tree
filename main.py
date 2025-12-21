from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


def main() -> int:
    node = shutil.which("node")
    if not node:
        print("ptree: Node.js is required but was not found in PATH.", file=sys.stderr)
        return 1

    repo_root = Path(__file__).resolve().parent
    cli_entry = repo_root / "ptree-syntax" / "bin" / "ptree.js"
    compiled_cli = repo_root / "ptree-syntax" / "out" / "cli.js"

    if not cli_entry.exists():
        print(f"ptree: CLI entry not found at {cli_entry}.", file=sys.stderr)
        return 1

    if not compiled_cli.exists():
        print(
            "ptree: Compiled CLI not found. Run `cd ptree-syntax && npm install && npm run compile`.",
            file=sys.stderr,
        )
        return 1

    return subprocess.call([node, str(cli_entry), *sys.argv[1:]])


if __name__ == "__main__":
    sys.exit(main())
