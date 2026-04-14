"""
Generate barrel exports (index.ts) for Svelte components.

This script scans the ui/components directory and generates index.ts files
following pattern convention:
- Component folders: {Name}/{Name}.svelte
- Optional types: {Name}/{Name}.types.ts

Usage:
    python scripts/generate-barrels.py | npm run generate-barrels
"""

from pathlib import Path

# Configuration
COMPONENTS_DIR = Path(__file__).parent.parent / "src" / "ui" / "components"
SUPPORTED_DIRECTORIES = ["elements", "modals", "sections", "views"]


def find_svelte_components(category_dir: Path) -> list[tuple[str, str, bool]]:
    """
    Recursively find all Svelte components following the pattern {Name}/{Name}.svelte.

    Returns list of tuples: (export_name, relative_path, has_types_file)
    - export_name: joined directory names (e.g., "DashboardFooter" for Dashboard/Footer/Footer.svelte)
    - relative_path: path from category root (e.g., "Dashboard/Footer/Footer.svelte")
    """
    components: list[tuple[str, str, bool]] = []

    for svelte_file in sorted(category_dir.rglob("*.svelte")):
        parent_dir = svelte_file.parent
        component_name = parent_dir.name

        if (
            svelte_file.name != f"{component_name}.svelte"
            and svelte_file.name != "component.svelte"
        ):
            continue

        relative_path = svelte_file.relative_to(category_dir)
        dir_parts = list(relative_path.parts)[:-1]

        if len(dir_parts) < 1:
            continue

        export_name = "".join(dir_parts)

        types_file = parent_dir / f"{component_name}.types.ts"
        types_file_fallback = parent_dir / "types.ts"
        has_types = types_file.exists()

        if not has_types:
            has_types = types_file_fallback.exists()

        components.append((export_name, str(relative_path), has_types))

    return components


def generate_barrel_content(components: list[tuple[str, str, bool]]) -> str:
    """
    Generate the content for an index.ts barrel file.

    Pattern:
        export { default as ComponentName } from './Path/To/Component.svelte';
        export type { ComponentNameProps } from './Path/To/Component.types';
    """
    if not components:
        return ""

    lines: list[str] = []

    for export_name, relative_path, has_types in components:
        lines.append(f"export {{ default as {export_name} }} from './{relative_path}';")

        if has_types:
            types_path = ""

            if "component.svelte" in relative_path:
                types_path = relative_path.replace("component.svelte", "types")
                lines.append(
                    f"export type {{ default as {export_name}Props }} from './{types_path}';"
                )
            else:
                types_path = relative_path.replace(".svelte", ".types")
                lines.append(
                    f"export type {{ {export_name}Props }} from './{types_path}';"
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

    print(f"Done! Generated/updated {generated_count} barrel file(s).")


if __name__ == "__main__":
    main()
