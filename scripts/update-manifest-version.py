"""
Update manifest.json version to match package.json.

Reads package.json and manifest.json from the plugin root, copies the
"version" field from the former into the latter, preserving tab indentation
and a trailing newline.

Usage:
    python scripts/update-manifest-version.py

Called by semantic-release via .releaserc prepareCmd.
Exits 1 on any error (missing file, invalid JSON, etc).
"""

import json
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent.parent

    pkg_path = root / "package.json"
    manifest_path = root / "manifest.json"

    try:
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON in {e.doc}: {e.msg}", file=sys.stderr)
        sys.exit(1)

    if "version" not in pkg:
        print("Error: 'version' key not found in package.json", file=sys.stderr)
        sys.exit(1)

    manifest["version"] = pkg["version"]

    try:
        with open(manifest_path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(manifest, f, indent="\t", ensure_ascii=False)
            f.write("\n")
            print(f"Updated manifest version to {manifest['version']}", file=sys.stdout)
    except OSError as e:
        print(f"Error: could not write {manifest_path}: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
