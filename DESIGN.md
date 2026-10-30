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

### Surface and line roles

Components read these semantic aliases instead of picking a raw Obsidian variable, so one role changes in one place:

| Role | SCSS token | Obsidian source | Used by |
| --- | --- | --- | --- |
| Canvas | `$background-primary` | `--background-primary` | page and table container |
| Raised | `$surface-raised` | `--background-primary-alt` | table head, mobile cards |
| Muted | `$surface-muted` | `--background-modifier-hover` | badge fills |
| Subtle line | `$line-subtle` | `--background-modifier-border` | dividers, control borders |
| Strong line | `$line-strong` | `--background-modifier-border-hover` | container borders, empty state |

Semantic tones are the same contract for badges: `neutral`, `accent`, `success`, `warning`, `error`, `ghost`. Each maps to an Obsidian ink plus its tint (`$text-success` + `$status-success-background`, and so on). The plugin still declares no colour of its own.

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
- Tracking: `$letter-spacing-caps` (0.08em) on uppercase column heads and meta labels; every other run keeps the theme's tracking.

The plugin's own values are spatial:

| Scale | Values |
| --- | --- |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 px (`$spacing-xxs` … `$spacing-xl`) |
| Radius | 2 / 4 / 8 / 12 / 16 px (`$radius-xs` … `$radius-xl`), plus `$radius-full` for a circle and `$radius-pill` for a pill |
| Border width | `--border-width`; settings use `--setting-items-border-width` |
| Elevation | `$shadow-sm/md/lg`, always a `color-mix` of the theme's text colour — never a fixed `rgba()` |
| Motion | 150 / 200 / 300 ms; easings `ease`, `ease-in`, `ease-out`, `ease-in-out`, `smooth` (`cubic-bezier(0.4, 0, 0.2, 1)`), `spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) |
| Z-index | base 1, dropdown 100, sheet 500, modal 1000, popover 1100, toast 2000 |
| Control sizes | 32 / 44 / 52 px (`$control-sm/md/lg`) — the shared field, button and touch height |

Components read these tokens for whatever they share with another component — a field height, the touch minimum, the caps tracking. Geometry that belongs to one component is a local `$var` in that component's style block: a table row at 56px, a header row at 40px, a badge at 22px and its dot at 6px, the Manage table's columns (type 96, status 132, due 104, open 44; decks takes 20% of the row and the preview the rest), the sheet at 440px, a mobile card at 116px. Changing one then cannot move another screen. Fields use `$radius-md` (8px): radii are plugin-owned, and Obsidian's `--input-radius` / `--button-radius` / `--setting-items-radius` are deliberately not mapped, so a field keeps its shape across themes.

Surfaces share a radius hierarchy: containers and popovers are `$radius-md` (8px) — Input, Textarea, Button, Card, Banner, Table, EmptyState, and the Combobox, NavigationMenu and Select panels alike; items inside them are `$radius-sm`; only a dialog takes `$radius-lg`. Elevation is `$shadow-sm/md/lg` and nothing else — a popover is `$shadow-md`.

## Breakpoints and the mobile contract

Breakpoints: 480 (`$mobile-breakpoint`), 768 (`$tablet-breakpoint`), 1024 (`$laptop-breakpoint`), 1280 (`$desktop-breakpoint`), 1536 (`$widescreen-breakpoint`). The Manage index switches from the table to scan cards at 768px, the same breakpoint at which the Manage sheet stops being a side panel and covers the leaf, so a narrow pane never pairs a table with a full-screen editor. Above 768 the table stays the scan surface while its preview column absorbs the squeeze.

The plugin must work on Obsidian Mobile (`isDesktopOnly: false`). `_mobile.scss` is the contract for coarse pointers:

- `(hover: none) and (pointer: coarse)`: interactive elements take a 44px minimum in both axes.
- At or below 480px the same sizing applies even with a fine pointer, so the phone layout stays touch-sized in a narrow pane or the responsive preview. A chip that carries a remove control is a target and takes 44px; a plain chip is a label and keeps its 22px height, with its text stepped up to `$font-md`.
- Hover lifts and shadows are removed on touch; `:active` gives a `scale(0.98)` press instead.
- Interactive card and rating surfaces are non-selectable; `-webkit-tap-highlight-color` is transparent.
- Review gestures: `touch-action: pan-y` on the review column, `none` on the card wrapper.
- Motion complexity is reduced at or below 480px, and silenced entirely under `prefers-reduced-motion`.

## Components and conventions

- Svelte 5 runes (`$props`, `$state`, `$effect`); one folder per component (`ComponentName/component.svelte`, optional `types.ts`).
- Components live under `src/ui/components/` (`elements/`, `compositions/`, `sections/`, `modals/`, `views/`); views under `src/ui/views/`; stores, controllers, context, and actions sit beside them (`ui/store`, `ui/controllers`, `ui/context`, `ui/actions`).
- Every CSS class carries the `ml-` prefix; the `require-class-prefix` ESLint rule enforces it (`lc-*` from LayerChart is the only exemption).
- Markdown renders through `.ml-markdown-rendered`: tables, `pre`, and math scroll horizontally rather than overflowing; images and embeds are capped at 100%.
- Use semantic elements — a real `<table>` on desktop, labelled cards on mobile — and give icon-only controls an accessible name and a visible focus treatment.
- Element APIs express design intent, not raw CSS: `Button variant`/`size`, `Badge variant` (the semantic tone) and `radius`, `Chip variant` (surface) with `shape`/`size`, `Table.Row selected`, `Combobox.Trigger variant`. A section must not reach into an element's internal class names to restyle it; if two screens need the same change, it becomes a prop.
- Compositions (`compositions/`) are reusable compositions of primitives: they assemble elements into a task-level unit such as `FlashcardForm`, take their data and callbacks through props, and are consumed by sections and views. They are not tied to one screen.
- `Textarea` grows with its content (`ui/actions/autosize.ts`), so the field never scrolls internally and the sheet body is the only scroller. `rows` stays the floor for a short field; there is no resize handle.

### The Manage pattern

Manage is a **read-only index** plus a **single editor**:

- The table and the mobile cards are scan surfaces. They carry no inline inputs: type and status are badges, decks are filled chips, and the last column is a chevron. The row's primary control is a real anchor (a vault deep link), stretched over the row, so modifier-click still opens the note. A cloze preview keeps every deletion as `[...]`, so the index never spoils an answer.
- The deck cell shows at most two chips and folds the rest into `+N`. Deck names ellipsize in a narrow column: the chips shrink, the fold count never does. Truncation is not a hiding place — the fold carries the remaining names to assistive tech, and the cell's `title` gives the full list on hover.
- The non-modal `Sheet`, rendered by the `FlashcardForm` composition, is the only editor. Rows open it for an existing card; Add opens the same sheet in create mode, empty, with a card-type field. It is 440px on desktop, overlays the table without a scrim, keeps the rows live, and closes on Escape or the close control. At 768px and below it covers the leaf, bottom nav included; its footer is sticky.
- In create mode the sheet has no status field and no Delete action; Create writes a new card with the default ACTIVE status, and the row appears from the metadata parse without waiting for the index. Its header carries no meta row, because the card-type field already states the type.
- Delete lives in the sheet footer and still goes through `AlertDialog`.
- Status tones: ACTIVE `success`, PAUSED `neutral`, STALE `warning`, DELETED `error`. The tone carries the colour and the badge draws no dot. The type badge reads the stored enum as a title-cased label (`Basic`, `Cloze`).
- The row for the open sheet keeps a marker: hover surface plus a 2px inset accent bar on its first cell.

## Constraints the design must respect

- Never define or override a background, text, or accent colour; consume Obsidian's variables.
- Never introduce a second accent or a custom web font.
- Never let a UI failure escape the plugin: error boundaries at plugin edges, and no degradation of Obsidian.
- Stay performant at 50,000 cards — no UI pattern that requires rendering the whole vault.
- Prefer progressive disclosure over showing every control in one plane (the Manage critique's open refinement).
