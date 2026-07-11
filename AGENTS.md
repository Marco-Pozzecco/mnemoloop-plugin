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

# Type checking (tsc --noEmit)
npm run typecheck

# Lint CSS class prefix compliance (python scripts/check-css-prefix.py)
npm run lint:css-prefix
```

---

## Architecture

### Directory Structure

```
src/
├── main.ts              # Plugin entry point (Obsidian Plugin class)
├── interfaces/           # TypeScript interfaces
│   ├── parser/           # Parser interfaces (IEntityParser, IContentParser, IYamlParser, utils)
│   ├── IAdapter.ts       # Adapter interface
│   ├── ICommand.ts       # Command interface
│   ├── IEvent.ts         # Event interfaces
│   └── …                 # IEventBus, IEventHandler, IEventRegistry, IEventRouter, IIndexer,
│                         # IReviewEngine, IReviewItem, IReviewQueue, IWriter
├── modules/             # Core business logic
│   ├── adapters/        # Data persistence (FlashcardAdapter, SettingsAdapter, StatisticsAdapter, EventLogAdapter)
│   ├── commands/        # Obsidian commands (palette/, editor-menu/, file-menu/)
│   ├── parsers/         # Markdown flashcard parsing
│   │   ├── _core/       # Abstract base classes (Entity.ts, Content.ts, Yaml.ts)
│   │   ├── entity/      # Entity parsers (FlashcardParser)
│   │   ├── content/     # Per-card-type content parsers
│   │   └── yaml/        # YAML frontmatter parsers (FlashcardYamlParser)
│   ├── indexers/        # In-memory flashcard indexing/caching (FlashcardIndexer)
│   ├── events/          # Internal event system
│   │   ├── core/        # EventBus, EventRegistry, EventRouter, Event, EventHandler
│   │   ├── domains/     # Event type definitions organized by domain
│   │   ├── handlers/    # Event handler implementations organized by domain
│   │   └── routes/      # Event-to-handler route registrations by domain
│   ├── review-engines/  # FSRS review algorithm integration
│   ├── review-queues/   # Flashcard review queue management
│   ├── review-items/    # Individual review item logic + ReviewItemFactory.ts
│   └── writers/         # File write operations (FlashcardWriter)
├── ui/                  # Svelte 5 components
│   ├── components/      # Reusable Svelte components (elements/, views/, sections/, modals/)
│   ├── views/           # Main view containers
│   │   ├── App/         # App.svelte, AppView.ts, types.ts
│   │   ├── Settings/    # Settings.svelte, SettingsView.ts, types.ts
│   │   └── Modal/       # Modal.svelte, ModalView.ts, types.ts
│   ├── store/           # Svelte stores
│   │   ├── base.store.ts            # BaseStoreManager<T> class
│   │   ├── banner.store.ts          # Banner notifications
│   │   ├── modal.store.ts           # Modal state
│   │   ├── session.store.ts         # Review session state
│   │   ├── settings.store.ts        # Plugin settings
│   │   ├── deck-tree.store.ts       # Deck hierarchy tree
│   │   ├── stats.store.ts           # Review statistics
│   │   ├── analytics.store.ts       # Analytics data
│   │   ├── chart.forecast.store.ts  # Forecast chart data
│   │   └── ui.store.ts             # UI state
│   ├── controllers/     # UI controllers
│   │   ├── DashboardController.ts
│   │   ├── AnalyticsController.ts
│   │   ├── ForecastChartController.ts
│   │   ├── ModalController.ts
│   │   └── ReviewController.ts
│   ├── styles/          # SCSS styles
│   │   ├── main.scss
│   │   ├── _theme.scss
│   │   ├── _tokens.scss
│   │   ├── _mobile.scss
│   │   └── _breakpoints.scss
│   ├── context/         # Svelte context providers
│   └── actions/         # Svelte actions (markdown.ts, gestures.ts)
├── types/               # TypeScript type definitions (adapters.ts, commands.ts, indexes.ts, parsers.ts, writers.ts)
├── schemas/             # Zod validation schemas
│   ├── flashcard.ts
│   ├── flashcard.base.ts
│   ├── flashcard.sequence.ts
│   ├── flashcard.utils.ts   # CardType enum, CardTypeSchema, FlashcardYamlSchema
│   ├── event-log.ts
│   └── …                 # indexer.ts, settings.ts, statistics.ts, srs.ts
└── utils/               # Utility functions
    ├── Cache.ts
    ├── Clone.ts
    ├── constants.ts
    ├── deck-utils.ts
    ├── errors.ts
    ├── Logger.ts
    ├── Queue.ts
    ├── statistics-utils.ts
    ├── String.ts
    ├── token.ts
    ├── VaultWatcher.ts
    └── Workspace.ts
```

### Key Patterns

**Adapters** (`modules/adapters/`)

- Persist data to JSON files in plugin directory
- Extend `BaseAdapter<T>` and implement `IAdapter<T>`
- Adapters are pure data stores — they do not emit events themselves; events are published externally via `EventBus` when changes occur
- Adapters: `FlashcardAdapter` (→ flashcard-index.json), `SettingsAdapter`, `StatisticsAdapter`, `EventLogAdapter` (event logging)

**Indexers** (`modules/indexers/`)

- Maintain in-memory caches of parsed flashcard metadata
- Provide fast lookup without re-parsing files
- Sync with adapters for persistence

**Parsers** (`modules/parsers/`)

- **Entity parsers** (`entity/`) — `FlashcardParser` extends `EntityParser<Entity, EntityYaml, EntityContent>` (abstract base in `_core/Entity.ts`). Implements `IEntityParser<Entity, EntityYaml, EntityContent>` from `interfaces/parser/IEntityParser.ts`. Single entry point for parsing flashcard files; dispatches to per-card-type content parsers.
- **Content parsers** (`content/`) — per-card-type parsers implementing `IContentParser<Content>` (interface in `interfaces/parser/IContentParser.ts`). Examples: `FlashcardBasicContentParser`, `FlashcardSequenceContentParser`.
- **YAML parsers** (`yaml/`) — `FlashcardYamlParser` extends `YamlParser<EntityYaml>` (abstract base in `_core/Yaml.ts`). Implements `IYamlEngine<EntityYaml>` from `interfaces/parser/IYamlParser.ts`. Handles frontmatter extraction and serialization.
- **Core abstractions** (`_core/`) — `Entity.ts` (base entity parser with file parsing, metadata extraction), `Content.ts` (content parsing utilities), `Yaml.ts` (base YAML parser with frontmatter regex extraction).

**Events** (`modules/events/`)
Four-layer architecture decoupling event declaration, routing, and handling:

- **domains/** — Declare event types using `EventFactory`:
  - `EventFactory.createEvent<T>(type)` → fire-and-forget event class
  - `EventFactory.createRequest<T>(type)` → request event (type suffix `:Request`)
  - `EventFactory.createResponse<T>(type)` → response event (type suffix `:Response`)
  - Pattern: one file per domain sub-area (e.g., `domains/flashcard/adapter.ts` defines all flashcard adapter events; `domains/flashcard/parsers.ts` defines all parser events)
  - Domain files: `flashcard/` (adapter, indexer, parsers, review, statistics, writer), `settings/` (adapter), `statistics/` (adapter), `ui/` (dashboard), `vault.ts` (single file, not a directory)
  - `domains/index.ts` re-exports: `flashcard`, `settings`, `statistics`, `vault`, `ui/dashboard`

- **handlers/** — Implement `EventHandler<E>` for each event, with a constructor that receives `IEventRegistryDependencies`:

  ```
  export class FlashcardAdapterInitHandler extends EventHandler<FlashcardAdapterInitEvent> {
    async handle(_event: FlashcardAdapterInitEvent): Promise<void> { … }
  }
  ```

  - Access dependencies via `this._adapters`, `this._indexers`, `this._parsers`, `this._writers`, `this._bus`, `this._plugin`
  - Handlers publish follow-up events via `this._bus.publish(…)`
  - Handler files in `flashcard/` use singular naming (e.g., `parser.ts`)

- **routes/** — Wire events to handlers using `EventRouter`:

  ```
  const router = new EventRouter();
  router.route(events.SomeEvent, handlers.SomeEventHandler);
  ```

  - Each domain sub-area exports its own router (e.g., `FlashcardAdapterRouter`)
  - Domain-level routers combine sub-routers (e.g., `FlashcardRouter` combines all flashcard routers)
  - Top-level `IndexRouter` (in `routes/index.ts`) combines all domain routers
  - Route files use singular naming in `flashcard/` (e.g., `parser.ts`). Note: domains use plural (`parsers.ts`), but routes and handlers use singular (`parser.ts`) — this is an intentional naming distinction.

- **core/** — Infrastructure:
  - `EventBus` (singleton) — `publish()`, `subscribe()`, `subscribeOnce()`, `unsubscribe()`
  - `EventRegistry` — takes a bus, deps, and router; `initialize()` instantiates handlers and subscribes them to the bus
  - `EventRouter` — `route(eventClass, handlerClass)` and `combine(...routers)`. Exported from `core/EventRouter.ts` directly and accessible via `events/index.ts` re-export, but NOT from `core/index.ts`.
  - `core/index.ts` exports: `Event`, `EventRequest`, `EventResponse`, `EventDataOf`, `EventBus`, `EventHandler`, `EventRegistry`.
  - `Event<T>` / `EventRequest<T>` / `EventResponse<T>` — base classes; every event has `id`, `type`, `time`, `data`

**Initialization flow in main.ts:** `loadAdapters()` pushes init events into `_initializationEvents[]` → `initializeEventRegistry()` creates `EventRegistry` with `IndexRouter`, calls `initialize()`, then publishes all pending init events via `EventBus.instance.publish()`.

**Commands** (`modules/commands/`)

- Implement `ICommand` interface and extend `BaseCommand`
- Organized by: `palette/` (command palette), `editor-menu/` (editor context menu), `file-menu/` (file context menu)
- Registered via `CommandRegistry` in `main.ts`
- Receive dependencies via `register(deps: ICommandDependencies)` method — access them through protected getters (`this.plugin`, `this.adapters`, `this.indexes`, `this.parsers`, `this.writers`)
- Define `readonly id: string` and `readonly name: string`; implement `onRegister()` for setup, optionally `onUnregister()` for cleanup
- Add to `CommandKey` enum and `CommandMap` interface in `src/types/commands.ts`
- Example: `OpenDashboardCommand` registers the "Mnemoloop: Open Dashboard" palette command

**UI Components** (`ui/components/`)

- Use Svelte 5 runes syntax (`$props()`, `$state()`)
- Pattern: `ComponentName/component.svelte` with optional `types.ts`
- Organized by: `elements/`, `views/`, `sections/`, `modals/`

**Stores** (`ui/store/`)

- Most stores extend `BaseStoreManager<T>` (in `base.store.ts`), which wraps Svelte `Writable<T>` with a class-based API (syncs `this.state` via subscription)
- Stores: `banner.store.ts` (own pattern), `modal.store.ts`, `session.store.ts`, `settings.store.ts`, `deck-tree.store.ts`, `stats.store.ts`, `analytics.store.ts`, `chart.forecast.store.ts`, `ui.store.ts`

**Controllers** (`ui/controllers/`)

- MVC-style controllers bridging stores and event system
- Controllers: `DashboardController`, `AnalyticsController`, `ForecastChartController`, `ModalController`, `ReviewController`

---

## Build System

### Dual TypeScript Config

- `tsconfig.json` - Main TypeScript config (ES2022, strict, path alias `@/*`, `noEmit: true`)
- `tsconfig.svelte.json` - Extends main, adds `verbatimModuleSyntax`. Includes `**/*.svelte` and `**/*.svelte.ts`. Sets `inlineSourceMap: false`, `inlineSources: false` (overrides main tsconfig defaults).
- `tsconfig.build.json` - Extends main with `noEmit: false`. Used by `npm run build` (`tsc -p tsconfig.build.json && vite build`).

### Vite Configuration

- Entry: `src/main.ts`
- Output: `dist/main.js` (CommonJS format for Obsidian)
- CSS bundled as `dist/styles.css`
- **Auto-copy**: Custom plugin copies `dist/main.js` and `dist/styles.css` to root after build
- **External deps**: `obsidian`, `electron`, all `@codemirror/*`, `@lezer/*` packages (not bundled)
- CSS output: Vite `assetFileNames: 'styles.css'` ensures CSS is directly named `styles.css` (no rename step)
- **Build-time defines**: `__DEV__` and `__LOG_LEVEL__` are injected by Vite `define` block. Used by `src/env.ts` which exports `LogLevel` enum and `env` object for runtime log level control.

### CSS Handling

- Source: `src/ui/styles/main.scss` (SCSS, not CSS)
- SCSS partials: `_breakpoints.scss`, `_mobile.scss`, `_theme.scss`, `_tokens.scss`
- SCSS preprocessing configured in `vite.config.ts` via `sveltePreprocess({ scss: { includePaths: [...] } })`
- Bundled as `styles.css` via Vite
- Uses Obsidian CSS variables (`--text-normal`, `--interactive-accent`, etc.)

---

## Testing

- **Framework**: Vitest with Node environment
- **Setup**: `tests/setup.ts` mocks the `obsidian` module
- **Location**: `tests/unit/`
- **Pattern**: `*.test.ts` files (e.g., `moduleName.test.ts`)
- **Helpers**: `tests/helpers/` — shared test utilities: `mock-obsidian.ts`, `factories.ts`, `date-fixtures.ts`, `reset-singletons.ts`
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

**Manifest Version Sync** (`npm run build` calls this automatically)

- Python script: `scripts/update-manifest-version.py`
- Synchronizes `manifest.json` version with `package.json`

**ESLint** (`eslint.config.js`)

- Flat config using `typescript-eslint`
- `eslint-plugin-obsidianmd` — Obsidian-specific linting rules (applied to `**/*.ts`, ignored for `**/*.js` and `vite.config.ts`)
- Svelte plugin (`eslint-plugin-svelte`) for `.svelte` files, with `svelte-eslint-parser`
- Prettier integration via `eslint-config-prettier`
- Custom rule: `eslint-rules/require-class-prefix.js` — enforces CSS class prefix convention in Svelte templates (ignores `lc-*` prefix from layerchart and dynamic expressions)
- **Important**: `no-undef` rule disabled (TypeScript handles this)

**Prettier** (`.prettierrc`)

- Single quotes
- Trailing commas: all
- Print width: 100
- Semicolons: true

---

## Dependencies

### Runtime Dependencies

| Package                           | Purpose                          |
| --------------------------------- | -------------------------------- |
| `svelte` ^5.48.2                  | UI framework with runes          |
| `ts-fsrs` ^5.2.3                  | FSRS spaced repetition algorithm |
| `zod` ^4.3.5                      | Schema validation                |
| `bits-ui` ^2.18.0                 | Headless Svelte UI primitives    |
| `layerchart` ^2.0.0-next.56       | Data visualization               |
| `uuid` ^13.0.0                    | UUID generation                  |
| `@internationalized/date` ^3.12.1 | Date utilities                   |
| `d3-scale` ^4.0.2                 | D3 scales for charts             |
| `d3-hierarchy` ^3.1.2             | Hierarchy layout for deck tree   |
| `@dnd-kit/svelte` ^0.5.0          | Drag-and-drop for sequence cards |

### Dev Dependencies

| Package                                             | Purpose                              |
| --------------------------------------------------- | ------------------------------------ |
| `obsidian` ^1.4.0                                   | Obsidian API (external, not bundled) |
| `vite` ^6.0.0                                       | Build toolchain                      |
| `@sveltejs/vite-plugin-svelte` ^5.0.3               | Svelte Vite integration              |
| `svelte-preprocess` ^6.0.3                          | SCSS preprocessing                   |
| `sass` ^1.101.0                                     | SCSS compiler                        |
| `vitest` ^1.0.0                                     | Testing framework                    |
| `@vitest/coverage-v8` ^1.6.1                        | Test coverage                        |
| `typescript` ^5.0.0                                 | TypeScript compiler                  |
| `svelte-check` ^4.4.5                               | Svelte type checking                 |
| `eslint` ^10.4.1                                    | Linting                              |
| `typescript-eslint` ^8.48.1                         | TypeScript ESLint plugin             |
| `eslint-plugin-svelte` ^3.14.0                      | Svelte linting rules                 |
| `svelte-eslint-parser` ^1.8.0                       | Svelte parser for ESLint             |
| `eslint-plugin-obsidianmd` ^0.3.0                   | Obsidian-specific linting rules      |
| `eslint-config-prettier` ^10.1.8                    | Prettier/ESLint integration          |
| `@eslint/compat` ^1.4.0                             | ESLint compat utilities              |
| `@eslint/js` ^9.39.1                                | ESLint base config                   |
| `globals` ^16.5.0                                   | Global variable definitions          |
| `prettier` ^3.0.0                                   | Code formatter                       |
| `semantic-release` ^25.0.5                          | Automated releases                   |
| `@semantic-release/changelog` ^6.0.3                | Changelog generation                 |
| `@semantic-release/exec` ^7.1.0                     | Release automation                   |
| `@semantic-release/git` ^10.0.1                     | Git release automation               |
| `conventional-changelog-conventionalcommits` ^9.3.1 | Changelog format                     |
| `@types/node` ^22                                   | Node.js type definitions             |
| `@types/uuid` ^10.0.0                               | UUID type definitions                |
| `@types/d3-hierarchy` ^3.1.7                        | d3-hierarchy type definitions        |
| `@types/d3-scale` ^4.0.9                            | d3-scale type definitions            |

---

## Obsidian Integration

### External Dependencies (Not Bundled)

The following are marked as external in Vite and must exist in Obsidian:

- `obsidian` - Core Obsidian API
- `electron` - Electron APIs
- `@codemirror/*` - All CodeMirror packages
- `@lezer/*` - All Lezer packages

---

## CI Pipeline

Order of operations (runs on Node 22 with npm cache). Defined in `apps/plugin/.github/workflows/release.yml`:

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

Additional documentation is maintained in the repository wiki (see OpenWiki section in root `AGENTS.md`) and in `docs/` under the site package (`apps/site/docs/`).

## Common Tasks

### Adding a New Component

1. Create folder: `src/ui/components/elements/MyComponent/`
2. Add `component.svelte` and optional `types.ts`
3. Run `npm run generate-barrels` to update exports
4. Import from barrel: `import { MyComponent } from '@/ui/components/elements';`

### Adding a New Adapter

1. Create class in `src/modules/adapters/MyAdapter.ts`
2. Extend `BaseAdapter<T>` and implement `IAdapter<T>`
3. Add key to `AdapterKey` enum in `src/types/adapters.ts`
4. Register in `main.ts` `loadAdapters()` method
5. Add to `AdapterMap` interface for type safety

**Non-keyed adapters**: `EventLogAdapter` is instantiated directly in `main.ts` `onload()` — it does not use the `AdapterKey` enum. The keyed adapters are: `settings`, `statistics`, `flashcard` (in `AdapterKey` enum).

### Adding a New Card Type

1. Add the new value to the `CardType` enum in `src/schemas/flashcard.utils.ts` and update the `CardTypeSchema` zod enum (same file).
2. Create `src/modules/parsers/content/Flashcard<Name>ContentParser.ts` implementing `IContentParser<Flashcard<Name>Content>` (use the `Flashcard` prefix per existing naming convention).
3. Register it in `main.ts` `loadParsers()` method inside the `contentParsers` array.
4. Create `src/modules/review-items/<Name>ReviewItem.ts` extending `BaseReviewItem` if scoring differs from the basic review item.
5. Register it in `ReviewItemFactory` in `main.ts` `loadReviewItemFactory()` method.
6. Add a UI component dispatched on `card_type` in `src/ui/components/views/Review/`.

### Adding a New Command

1. Create class in `src/modules/commands/{category}/MyCommand.ts` (category: `palette/`, `editor-menu/`, or `file-menu/`)
2. Extend `BaseCommand` and implement `onRegister()` method
3. Add key to `CommandKey` enum in `src/types/commands.ts`
4. Add to `CommandMap` interface for type safety
5. Register in `main.ts` `loadCommands()` method via `CommandRegistry`
6. Export from `src/modules/commands/index.ts` barrel

### Adding an Event, Handler, and Route

1. **Define the event** in `src/modules/events/domains/{domain}/{area}.ts` (note: `vault` domain is a single file `domains/vault.ts`, not a directory):
   - Use `EventFactory.createEvent<T>(type)` for fire-and-forget events
   - Use `EventFactory.createRequest<T>(type)` for events that need a response (suffix `:Request` auto-applied)
   - Use `EventFactory.createResponse<T>(type)` for responses (suffix `:Response` auto-applied)
   - Export both the class and its type alias:

     ```
     const MyEvent = EventFactory.createEvent<MyData>('Domain:Action');
     type MyEvent = IEvent<MyData>;
     export { MyEvent };
     ```

   - Add to the domain's `index.ts` barrel export

2. **Create the handler** in `src/modules/events/handlers/{domain}/{area}.ts`:
   - Extend `EventHandler<MyEvent>`:

     ```
     export class MyEventHandler extends EventHandler<MyEvent> {
       async handle(event: MyEvent): Promise<void> {
         const adapter = this._adapters.get(AdapterKey.whatever);
         // … side effects or publish follow-up events via this._bus.publish(…)
       }
     }
     ```

   - Add to the handler domain's `index.ts` barrel export

3. **Register the route** in `src/modules/events/routes/{domain}/{area}.ts`:

   ```
   const router = new EventRouter();
   router.route(events.MyEvent, handlers.MyEventHandler);
   export const MyAreaRouter = router;
   ```

   - If this is a new domain sub-area, combine its router into the domain-level router (e.g., `FlashcardRouter.combine(…, MyAreaRouter)`)
   - Export any new named router from the routes barrel (`routes/flashcard/index.ts` or equivalent)

4. **If this is a new domain** (new top-level domain beyond flashcard/settings/statistics/vault/ui):
   - Create `domains/{newdomain}/`, `handlers/{newdomain}/`, `routes/{newdomain}/` with their own barrel exports
   - Add the new domain router to `routes/index.ts` `IndexRouter.combine(…, NewDomainRouter)`
   - Re-export from `domains/index.ts` and `handlers/index.ts`

**Publishing events from outside the event system** (e.g., from a command or utility):

```
import { EventBus } from '@/modules/events';
EventBus.instance.publish(new MyEvent(data));
```

---

## Important Notes

1. **Always run commands from `apps/plugin/`** - The root has no build commands
2. **Version sync**: Keep `manifest.json` version in sync with `package.json`
3. **Fresh builds**: Use `npm run build` for production; `npm run dev` for development
4. **Test mocks**: Obsidian API is mocked; tests run in Node environment without Obsidian
5. **CSS variables**: Use Obsidian's CSS variables for theming compatibility
6. **Svelte 5**: Use runes syntax (`$props`, `$state`, `$effect`) not legacy syntax
7. **Build-time constants**: `__DEV__` and `__LOG_LEVEL__` are injected by Vite `define` block (see `vite.config.ts`). `src/env.ts` exports `LogLevel` enum and `env` object for runtime log level control. These are NOT available in tests — mock as needed.
8. **Production build**: Uses `tsc -p tsconfig.build.json` (which sets `noEmit: false`, overriding main tsconfig's `noEmit: true`) then Vite bundles. The type check step before bundling ensures all imports resolve.
9. **CI**: Runs on Node 22. Pipeline defined in `apps/plugin/.github/workflows/release.yml`. Uses `semantic-release` for automated versioning.

<!-- OPENWIKI:START -->

## OpenWiki

This repository uses OpenWiki for recurring code documentation. Start with `openwiki/quickstart.md`, then follow its links to architecture, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
