---
name: Mnemoloop Plugin
description: Obsidian-native spaced repetition UI. It inherits the user's theme and contributes structure — spacing, components, motion — never palette.
source: apps/plugin/src/ui/styles/_tokens.scss, apps/plugin/src/ui/styles/_theme.scss
theme: inherited — follows the active Obsidian theme (light or dark)
---

# Design system: Mnemoloop Plugin

## Source and visual direction

The plugin is an Obsidian surface, not a standalone app. Its source of truth is the plugin's own token layer — `src/ui/styles/_tokens.scss` and `_theme.scss`, which map Obsidian CSS variables onto SCSS variables — plus the components under `src/ui/`. The plugin adds no colour of its own: it reads the user's active Obsidian theme and stays native to it, so a Mnemoloop screen looks like the vault the user already chose. The critique of record states the principle directly — keep the product "visually native rather than introducing a competing palette."

Mode: **Operate**. The user is completing a task (create, review, manage, analyse), so scanability, consistency, and native expectations outrank expression. Brand lives in precise details, not in a competing look.

## The inherited canvas

Every colour below resolves to an Obsidian variable; the plugin never writes a hex value for chrome. This mapping is the contract in `_tokens.scss`.

| Role | SCSS variable | Obsidian source |
| --- | --- | --- |
| Ink | `$text-normal`, `$text-muted`, `$text-faint` | `--text-normal`, `--text-muted`, `--text-faint` |
| Accent ink | `$text-accent`, `$text-accent-hover` | `--text-accent`, `--text-accent-hover` |
| Status ink | `$text-error`, `$text-warning`, `$text-success` | `--text-error`, `--text-warning`, `--text-success` |
| Surfaces | `$background-primary`, `$background-secondary`, `$background-tertiary` (+ `-alt`) | `--background-primary`, … |
| Modifier surfaces | `$background-modifier-hover`, `-active`, `-selected`, `-form-field` | `--background-modifier-*` |
| Borders | `$background-modifier-border`, `-hover`, `-focus` | `--background-modifier-border*` |
| Accent action | `$interactive-accent`, `$interactive-accent-hover` | `--interactive-accent`, `--interactive-accent-hover` |
| Neutral action | `$interactive-normal`, `$interactive-hover` | `--interactive-normal`, `--interactive-hover` |
| Status fills | `$status-info/success/warning/error-background` | `--color-blue/green/orange/red` at 10 % |

Selected and hover borders are derived, not declared: `color-mix(in oklch, var(--color-accent) 70%, transparent)` for a selected border, 15 % for the selected surface. That is the one place the plugin mixes its own value, and it derives from the user's accent.

## Theme modes are Obsidian's, not the plugin's

There is no plugin dark set and no plugin light set. `_theme.scss` responds to the theme Obsidian is already showing:

- `.theme-dark` / `.theme-light` adjust only the shadow wash (30 % / 8 % of the theme's text colour).
- `prefers-reduced-motion: reduce` zeroes every transition.
- `prefers-contrast: high` swaps borders to `currentColor` at 2px.
- `@media print` flattens to ink on paper.

## Type, spacing, radii, motion

The plugin owns no type scale either — families, sizes, and weights are Obsidian's:

- Families: `$font-interface` (`--font-interface`), `$font-text` (`--font-text`), `$font-monospace` (`--font-monospace`).
- Sizes: `--font-ui-smaller`, `-small`, `-medium`, `-large`; headings from `--h1-size` … `--h6-size`. Below 480px the UI size steps are re-pinned (12 / 13 / 14 / 16 / 18).
- Weights: `--font-light`, `--font-normal`, `--font-medium`, `--font-semibold`, `--font-bold`.

The plugin's own values are spatial:

| Scale | Values |
| --- | --- |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 px (`$spacing-xxs` … `$spacing-xl`) |
| Radius | 2 / 4 / 8 / 12 / 16 / full (`$radius-xs` … `$radius-full`), plus Obsidian's `--button-radius`, `--input-radius`, `--setting-items-radius` |
| Border width | `--border-width`; settings use `--setting-items-border-width` |
| Elevation | `$shadow-sm/md/lg`, always a `color-mix` of the theme's text colour — never a fixed `rgba()` |
| Motion | 150 / 200 / 300 ms; easings `ease`, `ease-in/out/in-out`, `smooth` (`cubic-bezier(0.4, 0, 0.2, 1)`), `spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) |
| Z-index | base 1, dropdown 100, modal 1000, toast 2000 |

## Breakpoints and the mobile contract

Breakpoints: 480 (`$mobile-breakpoint`), 768 (`$tablet`), 1024 (`$laptop`), 1280 (`$desktop`), 1536 (`$widescreen`). The Manage table switches to labelled cards at 480px.

The plugin must work on Obsidian Mobile (`isDesktopOnly: false`). `_mobile.scss` is the contract for coarse pointers:

- `(hover: none) and (pointer: coarse)`: interactive elements take a 44px minimum in both axes.
- Hover lifts and shadows are removed on touch; `:active` gives a `scale(0.98)` press instead.
- Interactive card and rating surfaces are non-selectable; `-webkit-tap-highlight-color` is transparent.
- Review gestures: `touch-action: pan-y` on the review column, `none` on the card wrapper.
- Motion complexity is reduced at or below 480px, and silenced entirely under `prefers-reduced-motion`.

## Components and conventions

- Svelte 5 runes (`$props`, `$state`, `$effect`); one folder per component (`ComponentName/component.svelte`, optional `types.ts`).
- Components live under `src/ui/components/` (`elements/`, `views/`, `sections/`, `modals/`); views under `src/ui/views/`; stores, controllers, context, and actions sit beside them (`ui/store`, `ui/controllers`, `ui/context`, `ui/actions`).
- Every CSS class carries the `ml-` prefix; the `require-class-prefix` ESLint rule enforces it (`lc-*` from LayerChart is the only exemption).
- Markdown renders through `.ml-markdown-rendered`: tables, `pre`, and math scroll horizontally rather than overflowing; images and embeds are capped at 100%.
- Use semantic elements — a real `<table>` on desktop, labelled cards on mobile — and give icon-only controls an accessible name and a visible focus treatment.

## Constraints the design must respect

- Never define or override a background, text, or accent colour; consume Obsidian's variables.
- Never introduce a second accent or a custom web font.
- Never let a UI failure escape the plugin: error boundaries at plugin edges, and no degradation of Obsidian.
- Stay performant at 50,000 cards — no UI pattern that requires rendering the whole vault.
- Prefer progressive disclosure over showing every control in one plane (the Manage critique's open refinement).
