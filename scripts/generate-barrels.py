"""
Generate barrel exports (index.ts) for Svelte components.

This script scans the ui/components directory and generates index.ts files
following pattern convention:
- Component folders: {Name}/{Name}.svelte
- Optional types: {Name}/{Name}.types.ts

Usage:
    python scripts/generate-barrels.py | npm run generate-barrels
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# Configuration
COMPONENTS_DIR = Path(__file__).parent.parent / "src" / "ui" / "components"
SUPPORTED_DIRECTORIES = ["elements", "layouts", "sections", "views"]


def find_svelte_components(directory: Path) -> List[Tuple[str, bool]]:
    """
    Find all Svelte components in a directory following the pattern.

    Returns list of tuples: (component_name, has_types_file)
    """
    components = []

    for item in sorted(directory.iterdir()):
        if not item.is_dir():
            continue

        component_name = item.name
        svelte_file = item / f"{component_name}.svelte"
        types_file = item / f"{component_name}.types.ts"

        if svelte_file.exists():
            has_types = types_file.exists()
            components.append((component_name, has_types))

    return components


def generate_barrel_content(components: List[Tuple[str, bool]]) -> str:
    """
    Generate the content for an index.ts barrel file.

    Pattern:
        export { default as ComponentName } from './ComponentName/ComponentName.svelte';
        export type { ComponentNameProps } from './ComponentName/ComponentName.types';
    """
    if not components:
        return ""

    lines = []

    for component_name, has_types in components:
        # Component export
        lines.append(
            f"export {{ default as {component_name} }} from './{component_name}/{component_name}.svelte';"
        )

        # Types export (if types file exists)
        if has_types:
            lines.append(
                f"export type {{ {component_name}Props }} from './{component_name}/{component_name}.types';"
            )

    return "\n".join(lines) + "\n"


def process_directory(dir_name: str) -> bool:
    """
    Process a single component directory and generate its barrel file.

    Returns True if a barrel file was generated/updated.
    """
    target_dir = COMPONENTS_DIR / dir_name

    if not target_dir.exists():
        print(f"  ⚠️  Directory not found: {target_dir}")
        return False

    # Find components
    components = find_svelte_components(target_dir)

    if not components:
        print(f"  ⏭️  {dir_name}/ - No Svelte components found (skipping)")
        return False

    # Generate content
    content = generate_barrel_content(components)

    # Write index.ts
    index_file = target_dir / "index.ts"

    # Check if content is different
    if index_file.exists():
        existing_content = index_file.read_text()
        if existing_content == content:
            print(f"  ✓  {dir_name}/index.ts - Already up to date")
            return True

    index_file.write_text(content)
    print(f"  ✓  {dir_name}/index.ts - Generated ({len(components)} components)")
    return True


def main():
    """Main entry point."""
    print("Generating barrel exports...")
    print(f"Target directory: {COMPONENTS_DIR}")
    print()

    generated_count = 0

    for dir_name in SUPPORTED_DIRECTORIES:
        if process_directory(dir_name):
            generated_count += 1

    print()
    print(f"Done! Generated/updated {generated_count} barrel file(s).")


if __name__ == "__main__":
    main()
