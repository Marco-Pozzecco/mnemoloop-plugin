# Mnemoloop

> The active knowledge layer for Obsidian.  
> FSRS-powered spaced repetition that keeps your notes pristine.

<!--
TODO: Add hero screenshot or GIF here showing the dashboard + review interface
Recommended: 800-1200px wide, light & dark theme variants
-->

Mnemoloop is a high-performance, local-first spaced repetition system built directly into Obsidian. Unlike plugins that embed flashcard syntax into your source notes, Mnemoloop stores every flashcard as its own Markdown file — portable, git-friendly, and completely isolated from your thinking space. It pairs this with the state-of-the-art **FSRS scheduling algorithm**, automatic stale-card detection, and a modern dashboard that makes tracking your learning progress genuinely motivating.

Your notes stay pristine. Your retention improves. Your workflow never leaves Obsidian.

---

## Why Mnemoloop?

### Your Notes Stay Pristine
Every flashcard is a standalone Markdown file in a dedicated directory, linked back to its source note via YAML frontmatter. Your thinking space remains exactly as you designed it—no `!!` or `??` markers polluting your carefully organized literature reviews, course notes, or research documents.

### FSRS, Inside Obsidian
Mnemoloop is the only Obsidian plugin with native FSRS scheduling—the same scientifically validated algorithm powering modern Anki. Better retention. Fewer reviews. Less frustration. No context switching.

### Built for Mobile from Day One
Swipe to rate. Tap to flip. Responsive layouts. Mnemoloop works as beautifully on your phone as on your desktop—no separate app required, because it runs natively inside Obsidian Mobile.

### Reliability
Dual-source truth: a fast JSON index for queries, plus human-readable YAML frontmatter on every card for transparency and recovery. Even if the index is corrupted, all your SRS data lives in Markdown and can rebuild everything. Error boundaries ensure the plugin never brings down Obsidian.

---

## Features

| Feature | Description |
|---------|-------------|
| 🧠 **FSRS Scheduling** | State-of-the-art spaced repetition algorithm for optimal retention |
| 📄 **1 File = 1 Flashcard** | Each card is a standalone Markdown file—portable, version-controllable, never touches source notes |
| 📊 **Learning Dashboard** | Heatmaps, deck tree, daily goals, and retention rates |
| 🔒 **Local-First & Private** | Core features work fully offline. No telemetry. No data mining. Your knowledge belongs to you. |
| 🏗️ **Self-Healing Data** | JSON index + YAML dual-source truth with corruption recovery |
| ⚡ **High Performance** | Lazy card loading, debounced vault watching, and 50,000-card performance targets |

## Coming soon

| Feature | Description | 
|---------|-------------|
| 🤖 **AI-Powered Flashcard Generation** | AI generates flashcards from source notes, keeping your knowledge base up-to-date (paid feature) |
| 📱 **Mobile Touch UI** | Swipe left/right to rate, tap to flip — native feel inside Obsidian Mobile |
| 🔔 **Stale Detection** | Source note edits automatically flag linked flashcards as `STALE` |
| 📈 **Learning Analytics** | Track your learning progress with real-time analytics and progress tracking |

---

## Who Is This For?

- **Researchers & Academics** — Literature reviews, experimental protocols, paper notes. Stale detection catches when your understanding evolves.
- **Technical Lifelong Learners** — Course notes, code snippets, architecture decisions. Markdown flashcards render code blocks, LaTeX, and tables natively.
- **Medical & Law Students** — Dense memorization with rich formatting, diagrams, and embeds—exactly as your Obsidian notes already support.
- **Obsidian Power Users** — You treat your vault as a long-term knowledge asset. Mnemoloop respects that with transparent, portable, future-proof data.

---

## Getting Started

### Installation

1. Open **Settings → Community Plugins** in Obsidian
2. Search for **"Mnemoloop"** and install
3. Enable the plugin

### Create Your First Flashcard

- Open the **Command Palette** (`Ctrl/Cmd + P`) and run `Create empty flashcard`;
- Select text in a note and right click then click `Generate flashcard from selection` to turn selected text into a card;
- Click on the file menu then select `Generate flashcard from file` to create a empty flashcard linked to the source file.

### Review

Open the **Command Palette** and run **"Mnemoloop: Open Dashboard"** to see your learning stats and start a review session.

During review:
- **Space** — Flip the card
- **1 / 2 / 3 / 4** — Rate Again / Hard / Good / Easy
- **U** — Undo last rating
- **Swipe left / right** — Rate on mobile

### Decks & Organization

Organize flashcards into decks using YAML frontmatter:

```yaml
---
decks:
  - Maths::Linear algebra
  - CS::Algorithms
---
```

Use `::` for nested decks. Cards without a deck appear under **Uncategorized** in the deck tree.

---

## Flashcard Format

Each flashcard is a Markdown file with YAML frontmatter:

```markdown
---
uuid: 550e8400-e29b-41d4-a716-446655440000
source: "[[Biology/Cell biology.md]]"
status: ACTIVE
decks:
  - Biology::Cell structure
stability: 4.5
difficulty: 3.2
elapsed_days: 3
scheduled_days: 5
learning_steps: 1
reps: 4
lapses: 0
state: Review
last_review: 2026-05-10T09:00:00Z
due: 2026-05-15T09:00:00Z
---

What is the powerhouse of the cell?

?

The mitochondrion.
```

The `?` delimiter separates question from answer (configurable in settings). All SRS metadata lives in YAML—transparent, editable, and portable.

## Available Commands

| Context | Command |  Description |
|--- | ---------|-------------|
| Palette | Open Dashboard |  Open the learning dashboard |
| Palette | Create Empty Flashcard |  Create a new empty flashcard linked to the current note |
| Editor menu | Generate flashcard from selection | Creates a flashcard pre-filled with the currently selected text |
| File menu | Create flashcard from file | Creates an empty flashcard linked to the selected Markdown file |

---

## Contributing

```bash
cd apps/plugin
npm install
npm run dev       # development with hot reload
npm test          # run the test suite
npm run lint      # lint TypeScript and Svelte files
npm run build     # production build
npm run format    # format code with Prettier
```

For detailed architecture guidance, code patterns, and conventions, see [`AGENTS.md`](./AGENTS.md).

---

## Tech Stack

- **TypeScript** — Strict mode, path aliases (`@/*`)
- **Svelte 5** — Runes-based reactive UI (`$props`, `$state`, `$effect`)
- **Vite** — Build toolchain with auto-copy to Obsidian plugin directory
- **FSRS** — `ts-fsrs` for state-of-the-art spaced repetition scheduling
- **Vitest** — Unit testing with mocked Obsidian API
- **Zod** — Runtime schema validation
- **bits-ui** — Headless Svelte UI primitives
- **layerchart** — Data visualization for the dashboard

---

## License

[MIT](https://github.com/Marco-Pozzecco/obs-knowledge-accelerator/blob/main/LICENSE.md) © 2026 Marco Pozzecco
