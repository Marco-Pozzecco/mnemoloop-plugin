# AGENTS.md - Mnemoloop Plugin

## Instructions

- AGENT MUST follow the listed patterns
- AGENT MUST update this file when patterns change
- All development commands must be run from `apps/plugin/` directory

---

## Project Overview

**Mnemoloop** - A spaced repetition flashcard plugin for Obsidian built with TypeScript + Svelte 5 UI, bundled with Vite.

- **Entry Point**: `src/main.ts` → exports `MnemoloopPlugin` class
- **Manifest**: `manifest.json` (version must match package.json)

---

## Essential Commands

```bash
# Development (hot reload, auto-copies to root)
npm run dev

# Production build
npm run build

# Run tests (CI mode)
npm test -- --run

# Run tests (watch mode)
npm test

# Lint code
npm run lint

# Format code (prettier on ts/tsx/svelte)
npm run format

# Generate Svelte component barrel exports
npm run generate-barrels
```

---

## Architecture

### Directory Structure

```
src/
├── main.ts              # Plugin entry point (Obsidian Plugin class)
├── interfaces/           # TypeScript interfaces (IAdapter, IParser, etc.)
├── modules/             # Core business logic
│   ├── adapters/        # Data persistence (Settings, Flashcard, Statistics)
│   ├── commands/        # Obsidian commands (palette, editor-menu, file-menu)
│   ├── parsers/         # Markdown flashcard parsing
│   ├── indexers/        # In-memory flashcard indexing/caching
│   ├── event-listeners/ # File watchers, processors
│   ├── event-bus/       # Internal event system
│   ├── review-engines/  # FSRS review algorithm integration
│   ├── review-queues/   # Flashcard review queue management
│   ├── review-items/    # Individual review item logic
│   ├── writers/         # File write operations
│   └── yaml-engines/    # YAML frontmatter handling
├── ui/                  # Svelte 5 components
│   ├── components/      # Reusable Svelte components
│   │   ├── elements/    # Basic UI elements (Input, Button, etc.)
│   │   ├── views/       # View components (Dashboard, Review)
│   │   ├── sections/    # Layout sections
│   │   └── modals/      # Modal dialogs
│   ├── views/           # Main view containers (App, Settings, Modal)
│   ├── store/           # Svelte stores (modal.store.ts, etc.)
│   ├── styles/          # Global CSS styles
│   ├── context/         # Svelte context providers
│   ├── actions/         # Svelte actions
│   └── controllers/     # UI controllers
├── types/               # TypeScript type definitions
├── schemas/             # Zod validation schemas
└── utils/               # Utility functions (Logger, Cache, etc.)
```

### Key Patterns

**Adapters** (`modules/adapters/`)
- Persist data to JSON files in plugin directory
- Extend `BaseAdapter<T>` and implement `IAdapter<T>`
- Emit events on data changes
- Example: `FlashcardAdapter` saves to `flashcard-index.json`

**Indexers** (`modules/indexers/`)
- Maintain in-memory caches of parsed flashcard metadata
- Provide fast lookup without re-parsing files
- Sync with adapters for persistence

**Parsers** (`modules/parsers/`)
- Parse markdown files to extract flashcards
- Convert between markdown and structured data
- Handle YAML frontmatter

**Event Listeners** (`modules/event-listeners/`)
- Respond to file changes (FileWatcherListener)
- Process flashcard updates (FlashcardWriterProcessor)
- Track statistics (StatisticsListener)

**Commands** (`modules/commands/`)
- Implement `ICommand` interface and extend `BaseCommand`
- Organized by: `palette/` (command palette), `editor-menu/` (editor context menu), `file-menu/` (file context menu)
- Registered via `CommandRegistry` in `main.ts`
- Receive dependencies (plugin, adapters, indexes, parsers) via constructor
- Example: `OpenDashboardCommand` registers the "Mnemoloop: Open Dashboard" palette command

**UI Components** (`ui/components/`)
- Use Svelte 5 runes syntax (`$props()`, `$state()`)
- Pattern: `ComponentName/component.svelte` with optional `types.ts`
- Organized by: `elements/`, `views/`, `sections/`, `modals/`

---

## Build System

### Dual TypeScript Config

- `tsconfig.json` - Main TypeScript config (ES2022, strict, path alias `@/*`)
- `tsconfig.svelte.json` - Extends main, adds `verbatimModuleSyntax` for Svelte

### Vite Configuration

- Entry: `src/main.ts`
- Output: `dist/main.js` (CommonJS format for Obsidian)
- CSS bundled as `dist/styles.css`
- **Auto-copy**: Custom plugin copies `dist/main.js` and `dist/styles.css` to root after build
- **External deps**: `obsidian`, `electron`, all `@codemirror/*`, `@lezer/*` packages (not bundled)
- Post-build: `scripts/post-build.sh` renames `main.css` → `styles.css` if present

### CSS Handling

- Source: `src/ui/styles/main.css`
- Bundled as `styles.css` via Vite
- Uses Obsidian CSS variables (`--text-normal`, `--interactive-accent`, etc.)

---

## Testing

- **Framework**: Vitest with Node environment
- **Setup**: `tests/setup.ts` mocks the `obsidian` module
- **Location**: `tests/unit/`
- **Pattern**: `*.test.ts` files
- **Mock**: Obsidian API is mocked; tests run without Obsidian

---

## Code Patterns & Conventions

### TypeScript

- Strict mode enabled
- Path alias: `@/` maps to `src/`
- Enums for type-safe keys (e.g., `AdapterKey`, `ParserKey`, `IndexKey`)
- Zod schemas for runtime validation

### Svelte 5 Components

```svelte
<script lang="ts">
  import type { ComponentProps } from './types';
  
  // Use $props() rune for props
  let { prop1, prop2 = 'default' }: ComponentProps = $props();
  
  // Use $state() for reactive state
  let count = $state(0);
</script>
```

### Component File Pattern

```
ComponentName/
├── component.svelte    # Main component file
├── types.ts            # TypeScript types/props (optional)
└── utils.ts            # Component utilities (optional)
```

### Code Generation

**Barrel Exports** (`npm run generate-barrels`)
- Python script: `scripts/generate-barrels.py`
- Auto-generates `index.ts` files in component directories
- Exports components and their types for clean imports

---

## Lint & Format

**ESLint** (`eslint.config.js`)
- Flat config using `typescript-eslint`
- Svelte plugin for `.svelte` files
- Prettier integration
- **Important**: `no-undef` rule disabled (TypeScript handles this)

**Prettier** (`.prettierrc`)
- Tabs (not spaces), tabWidth: 2
- Single quotes
- Trailing commas: all
- Print width: 100
- Semicolons: true

---

## Dependencies

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `svelte` ^5.48.2 | UI framework with runes |
| `ts-fsrs` | FSRS spaced repetition algorithm |
| `zod` ^4.3.5 | Schema validation |
| `bits-ui` ^2.18.0 | Headless Svelte UI primitives |
| `layerchart` ^2.0.0 | Data visualization |
| `uuid` ^13.0.0 | UUID generation |
| `@internationalized/date` | Date utilities |
| `d3-scale` | D3 scales for charts |

### Dev Dependencies

- `obsidian` - Obsidian API (external, not bundled)
- `vite` + `@sveltejs/vite-plugin-svelte` - Build toolchain
- `vitest` - Testing
- `typescript` ^5.0.0 - TypeScript
- `eslint` + `prettier` - Linting/formatting

---

## Obsidian Integration

### External Dependencies (Not Bundled)

The following are marked as external in Vite and must exist in Obsidian:

- `obsidian` - Core Obsidian API
- `electron` - Electron APIs
- `@codemirror/*` - All CodeMirror packages
- `@lezer/*` - All Lezer packages

### Plugin Lifecycle

```typescript
// main.ts
export default class MnemoloopPlugin extends Plugin {
  async onload() {
    // 1. Initialize ribbon icon
    // 2. Load adapters (settings, flashcards, stats)
    // 3. Load parsers
    // 4. Load indexers
    // 5. Load event listeners
    // 6. Initialize views
    // 7. Load commands (via CommandRegistry)
  }
  
  onunload() {
    // Dispose listeners, unregister commands, clean up
  }
}
```

### Commands Registered

**Palette Commands:**
- `ml-open-dashboard` - Open plugin dashboard
- `open-settings` - Open plugin settings
- `ml-create-empty-flashcard` - Create empty flashcard

**Editor Menu Commands:**
- "Generate flashcard from selection" - Creates flashcard from selected text
- "Create empty flashcard in side panel" - Opens empty flashcard in right panel

**File Menu Commands:**
- "Generate flashcards from file" - Bulk generate from markdown file

---

## CI Pipeline

Order of operations (runs on Node 18 with npm cache):

1. `npm run lint`
2. `npm test -- --run`
3. `npm run build`

---

## Package Manager

- Uses **Yarn** (`yarn.lock` present at monorepo root)
- Use `npm` commands in scripts but prefer `yarn` for manual installs
- `package.json` type: `"module"` (ES modules)

---

## Documentation

Additional docs in `docs/` directory:

- `TODO.md` - Current task list


---

## Deck System

### Deck Storage
- Decks are stored as YAML array `decks: string[]` on each flashcard frontmatter
- Old cards without `decks` parse with `decks: undefined` — they are **never rewritten**
- New cards are created with `decks: []` via `DEFAULT_FLASHCARD_YAML`

### Nested Deck Syntax
- Anki-style `::` separator for nested decks (e.g., `Maths::Linear algebra`)
- Utility functions in `src/utils/deck-utils.ts`: `splitDeckPath`, `getParentDecks`, `matchesDeckFilter`
- Prefix match filtering: selecting `Maths` includes cards in `Maths::*` sub-decks

### Virtual "Uncategorized"
- "Uncategorized" is a **UI-only concept** — never persisted to card YAML
- Cards with `decks: undefined` or `decks: []` appear under "Uncategorized" in the deck tree
- The label is configurable via `default_deck_name` setting (default: `'Uncategorized'`)
- Query layer handles `'Uncategorized'` as a special filter matching cards with no decks

### No Migration Policy
- **No batch rewrite** of existing cards
- Old cards stay without `decks` forever
- New cards get `decks: []` on creation
- This is an intentional design decision to avoid touching user data

### Deck Tree Store
- `src/ui/store/deck-tree.store.ts` computes tree from `FlashcardIndexRecalcResponseEvent`
- Virtual normalization happens only in the store (not in query layer or YAML)
- Parent decks aggregate counts from all children
- Tree is reactive via Svelte writable store

## Common Tasks

### Adding a New Component

1. Create folder: `src/ui/components/elements/MyComponent/`
2. Add `component.svelte` and optional `types.ts`
3. Run `npm run generate-barrels` to update exports
4. Import from barrel: `import { MyComponent } from '@/components/elements';`

### Adding a New Adapter

1. Create class in `src/modules/adapters/MyAdapter.ts`
2. Extend `BaseAdapter<T>` and implement `IAdapter<T>`
3. Add key to `AdapterKey` enum in `src/types/adapters.ts`
4. Register in `main.ts` `loadAdapters()` method
5. Add to `AdapterMap` interface for type safety

### Adding a New Parser

1. Create class in `src/modules/parsers/MyParser.ts`
2. Extend `BaseParser` and implement `IParser`
3. Add key to `ParserKey` enum in `src/types/parsers.ts`
4. Register in `main.ts` `loadParsers()` method

### Adding a New Command

1. Create class in `src/modules/commands/{category}/MyCommand.ts` (category: `palette/`, `editor-menu/`, or `file-menu/`)
2. Extend `BaseCommand` and implement `onRegister()` method
3. Add key to `CommandKey` enum in `src/types/commands.ts`
4. Add to `CommandMap` interface for type safety
5. Register in `main.ts` `loadCommands()` method via `CommandRegistry`
6. Export from `src/modules/commands/index.ts` barrel

---

## Important Notes

1. **Always run commands from `apps/plugin/`** - The root has no build commands
2. **Version sync**: Keep `manifest.json` version in sync with `package.json`
3. **Fresh builds**: Use `npm run build` for production; `npm run dev` for development
4. **Test mocks**: Obsidian API is mocked; tests run in Node environment without Obsidian
5. **CSS variables**: Use Obsidian's CSS variables for theming compatibility
6. **Svelte 5**: Use runes syntax (`$props`, `$state`, `$effect`) not legacy syntax
