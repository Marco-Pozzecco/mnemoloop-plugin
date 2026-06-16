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
│   ├── events/            # Internal event system
│   │   ├── core/          # EventBus, EventRegistry, EventRouter, Event, EventHandler
│   │   ├── domains/       # Event type definitions organized by domain
│   │   ├── handlers/      # Event handler implementations organized by domain
│   │   └── routes/        # Event-to-handler route registrations by domain
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
- Adapters are pure data stores — they do not emit events themselves; events are published externally via `EventBus` when changes occur
- Example: `FlashcardAdapter` saves to `flashcard-index.json`

**Indexers** (`modules/indexers/`)
- Maintain in-memory caches of parsed flashcard metadata
- Provide fast lookup without re-parsing files
- Sync with adapters for persistence

**Parsers** (`modules/parsers/`)
- Parse markdown files to extract flashcards
- Convert between markdown and structured data
- Handle YAML frontmatter

**Events** (`modules/events/`)
Four-layer architecture decoupling event declaration, routing, and handling:

- **domains/** — Declare event types using `EventFactory`:
  - `EventFactory.createEvent<T>(type)` → fire-and-forget event class
  - `EventFactory.createRequest<T>(type)` → request event (type suffix `:Request`)
  - `EventFactory.createResponse<T>(type)` → response event (type suffix `:Response`)
  - Pattern: one file per domain sub-area (e.g., `domains/flashcard/adapter.ts` defines all flashcard adapter events)

- **handlers/** — Implement `EventHandler<E>` for each event, with a constructor that receives `IEventRegistryDependencies`:
  ```
  export class FlashcardAdapterInitHandler extends EventHandler<FlashcardAdapterInitEvent> {
    async handle(_event: FlashcardAdapterInitEvent): Promise<void> { … }
  }
  ```
  - Access dependencies via `this._adapters`, `this._indexers`, `this._parsers`, `this._writers`, `this._bus`, `this._plugin`
  - Handlers publish follow-up events via `this._bus.publish(…)`

- **routes/** — Wire events to handlers using `EventRouter`:
  ```
  const router = new EventRouter();
  router.route(events.SomeEvent, handlers.SomeEventHandler);
  ```
  - Each domain sub-area exports its own router (e.g., `FlashcardAdapterRouter`)
  - Domain-level routers combine sub-routers (e.g., `FlashcardRouter` combines all flashcard routers)
  - Top-level `IndexRouter` (in `routes/index.ts`) combines all domain routers

- **core/** — Infrastructure:
  - `EventBus` (singleton) — `publish()`, `subscribe()`, `subscribeOnce()`, `unsubscribe()`
  - `EventRegistry` — takes a bus, deps, and router; `initialize()` instantiates handlers and subscribes them to the bus
  - `EventRouter` — `route(eventClass, handlerClass)` and `combine(...routers)`
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
- CSS output: Vite `assetFileNames: 'styles.css'` ensures CSS is directly named `styles.css` (no rename step)

### CSS Handling

- Source: `src/ui/styles/main.css`
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

### Adding an Event, Handler, and Route

1. **Define the event** in `src/modules/events/domains/{domain}/{area}.ts`:
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
