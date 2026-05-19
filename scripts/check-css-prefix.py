#!/usr/bin/env python3
"""
Stand-alone script to verify that all class selectors in source CSS
(both .css files and <style> blocks inside .svelte files) use the
configured prefix.

Run:
    python3 scripts/check-css-prefix.py

Exit code 0 = all clear, 1 = violations found.
"""

import re
import sys
from pathlib import Path
from collections.abc import Iterator

ROOT = Path(__file__).parent.parent.resolve()

CONFIG = {
    "prefix": "ml-",
    # Class names / prefixes that are allowed without the project prefix
    # theme- = Obsidian body theme classes (theme-dark, theme-light)
    "allowedPrefixes": ["ml-", "lc-", "svelte-", "theme-"],
    # Specific class names to allow as exceptions
    "allow": [],
    # Directories to scan (relative to project root)
    "dirs": ["src/ui/styles", "src"],
}

CLASS_RE = re.compile(r"\.([a-zA-Z][a-zA-Z0-9_-]*)")
STYLE_TAG_RE = re.compile(r"<style[^>]*>([\s\S]*?)</style>", re.IGNORECASE)
CLASS_DIRECTIVE_RE = re.compile(r"class:([a-zA-Z][a-zA-Z0-9_-]*)")


def walk_files(dir: Path, extensions: list[str]) -> Iterator[Path]:
    for entry in dir.rglob("*"):
        if not entry.is_file():
            continue
        for ext in extensions:
            if entry.name.endswith(ext):
                yield entry.resolve()
                break


def remove_comments(css: str) -> str:
    # Block comments then line comments (same order as JS original)
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)
    css = re.sub(r"//.*$", "", css, flags=re.MULTILINE)
    return css


def strip_at_statements(css: str) -> str:
    # Remove @import 'file.css'; and @charset statements
    # These contain dots that look like class selectors
    return re.sub(r"@(import|charset)\s+[^;]+;", "", css)


def extract_class_selectors(css: str) -> list[str]:
    cleaned = remove_comments(strip_at_statements(css))
    return CLASS_RE.findall(cleaned)


def is_allowed(name: str) -> bool:
    if name in CONFIG["allow"]:
        return True
    if any(name.startswith(p) for p in CONFIG["allowedPrefixes"]):
        return True
    return False


def extract_template_class_directives(content: str) -> set[str]:
    """Extract class directive names from Svelte template markup (outside <style> and <script> blocks)."""
    # Remove <style> and <script> blocks so we only search template markup
    template = re.sub(r"<(style|script)[^>]*>[\s\S]*?</\1>", "", content, flags=re.IGNORECASE)
    return set(CLASS_DIRECTIVE_RE.findall(template))


def main() -> None:
    css_files: list[Path] = []
    svelte_files: list[Path] = []

    for d in CONFIG["dirs"]:
        dir_path = ROOT / d
        if not dir_path.exists():
            print(f"Warning: directory not found: {dir_path}")
            continue

        for file in walk_files(dir_path, [".css"]):
            css_files.append(file)
        for file in walk_files(dir_path, [".svelte"]):
            svelte_files.append(file)

    total_violations = 0
    files_with_violations = 0

    # ── Check standalone .css files ──
    for file in css_files:
        css = file.read_text(encoding="utf-8")
        selectors = extract_class_selectors(css)
        seen: set[str] = set()
        violations: list[str] = []

        for name in selectors:
            if name in seen:
                continue
            seen.add(name)
            if is_allowed(name):
                continue
            violations.append(name)

        if violations:
            total_violations += len(violations)
            files_with_violations += 1
            rel = file.relative_to(ROOT)
            print(f"\n{rel}")
            for v in violations:
                print(f'  ⚠  .{v} → missing "{CONFIG["prefix"]}" prefix')

    # ── Check <style> blocks inside .svelte files ──
    for file in svelte_files:
        content = file.read_text(encoding="utf-8")
        class_directives = extract_template_class_directives(content)
        styles = STYLE_TAG_RE.findall(content)

        if not styles:
            continue

        all_selectors: list[str] = []
        for css in styles:
            all_selectors.extend(extract_class_selectors(css))

        seen: set[str] = set()
        violations: list[str] = []
        for name in all_selectors:
            if name in seen:
                continue
            seen.add(name)
            if name in class_directives or is_allowed(name):
                continue
            violations.append(name)

        if violations:
            total_violations += len(violations)
            files_with_violations += 1
            rel = file.relative_to(ROOT)
            print(f"\n{rel}  (inside <style>)")
            for v in violations:
                print(f'  ⚠  .{v} → missing "{CONFIG["prefix"]}" prefix')

    if total_violations == 0:
        print(f'✅ All class selectors use the "{CONFIG["prefix"]}" prefix.')
        sys.exit(0)
    else:
        print(
            f"\n❌ {total_violations} unprefixed class selector(s) found across {files_with_violations} file(s)."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
