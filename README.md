# Mnemoloop

> The active knowledge layer for Obsidian.  
> FSRS-powered spaced repetition that keeps your notes pristine.

<!--
TODO: Add hero screenshot or GIF here showing the dashboard + review interface
Recommended: 800-1200px wide, light & dark theme variants
-->

Mnemoloop is a local-first spaced repetition system built directly into Obsidian. Unlike plugins that embed flashcard syntax into your source notes, Mnemoloop stores every flashcard as its own Markdown file: portable, git-friendly, and completely isolated from your thinking space. It pairs FSRS scheduling with a dashboard for heatmaps, deck trees, and retention analytics, so you review more in less time without leaving Obsidian.

Your notes stay pristine. Your retention improves. Your workflow never leaves Obsidian. **Start remembering more, reviewing less.**

---

## Why Mnemoloop?

### Your Notes Stay Pristine

Every flashcard is a standalone Markdown file in a dedicated directory, linked back to its source note via YAML frontmatter. Your thinking space remains exactly as you designed it—no `!!` or `??` markers polluting your carefully organized literature reviews, course notes or research documents.

### FSRS, Inside Obsidian

Mnemoloop brings native FSRS scheduling into Obsidian, the same scientifically validated algorithm powering modern Anki. Better retention, fewer reviews, no context switching.

### Built for Mobile from Day One

Swipe to rate. Tap to flip. Responsive layouts. Mnemoloop works as well on your phone as on your desktop, natively inside Obsidian Mobile.

### Reliability

Dual-source truth: a fast JSON index for queries, plus human-readable YAML frontmatter on every card for transparency and recovery. Even if the index is corrupted, all your SRS data lives in Markdown and can rebuild everything. Error boundaries ensure the plugin never brings down Obsidian.

---

## Features

| Feature                      | Description                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 🧠 **FSRS Scheduling**       | Scientifically validated spaced repetition algorithm for better retention with fewer reviews       |
| 📄 **1 File = 1 Flashcard**  | Each card is a standalone Markdown file—portable, version-controllable, never touches source notes |
| 📊 **Learning Dashboard**    | Heatmaps, deck tree, daily goals, and retention rates                                              |
| 🔒 **Local-First & Private** | Core features work fully offline. No telemetry. No data mining. Your knowledge belongs to you.     |
| 🏗️ **Self-Healing Data**     | JSON index + YAML dual-source truth with corruption recovery                                       |
| ⚡ **High Performance**      | Lazy card loading, debounced vault watching, and 50,000-card performance targets                   |
| 📈 **Learning Analytics**    | Track retention, forecast, and cumulative progress over time                                       |
| 📱 **Mobile Touch UI**       | Swipe left/right to rate, tap to flip: native feel inside Obsidian Mobile                          |
| 🔔 **Stale Detection**       | Source note edits automatically flag linked flashcards as `STALE`                                  |

## Coming soon

| Feature                                | Description                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 🤖 **AI-Powered Flashcard Generation** | AI generates flashcards from source notes, keeping your knowledge base up-to-date (paid feature) |

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

Creating a card is modal-driven:

- Open the **Command Palette** (`Ctrl/Cmd + P`) and run **Create flashcard** to open the flashcard form;
- Right-click a note in the **File Explorer** and select **Create flashcard from file** to open the form with the source pre-filled with a link to that note;
- Pick a **Basic**, **Sequence**, **Quiz**, or **Cloze** tab, enter your content, optionally assign one or more decks, and confirm.

The card is saved as its own Markdown file in your flashcards directory and opened in the editor.

### Review

Open the **Command Palette** and run **"Open dashboard"** to see your learning stats and start a review session.

During review:

- **Space** — Flip the card
- **1 / 2 / 3 / 4** — Rate Again / Hard / Good / Easy
- **U** — Undo last rating

### Decks & Organization

Organize flashcards into decks using YAML frontmatter:

```yaml
---
decks:
  - Maths::Linear algebra
  - CS::Algorithms
---
```

A card can belong to **multiple decks** — in the flashcard form, enter them as a comma-separated list (e.g. `Maths::Linear algebra, CS::Algorithms`). Use `::` for nested decks. Cards without a deck appear under **Uncategorized** in the deck tree.

---

## Flashcard Format

Each flashcard is a Markdown file with YAML frontmatter:

```markdown
---
uuid: 550e8400-e29b-41d4-a716-446655440000
source: '[[Biology/Cell biology.md]]'
status: ACTIVE
decks:
  - Biology::Cell structure
card_type: basic
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

The `card_type` field selects the card format (defaults to `basic`), and the `?` delimiter separates question from answer (configurable in settings). All SRS metadata lives in YAML—transparent, editable, and portable.

### Card Types

Mnemoloop supports four card types. Pick one in the flashcard form, or set `card_type` in YAML when authoring cards by hand.

#### Basic

A question and an answer, separated by the marker (`?` by default). During review, flip the card to reveal the answer and rate it manually.

```markdown
---
card_type: basic
---

What is the powerhouse of the cell?

?

The mitochondrion.
```

#### Sequence

A question plus an ordered list of steps (at least two). During review the steps are shuffled — drag them back into the correct order (drag works with touch on mobile). The card is scored automatically based on the final order.

```markdown
---
card_type: sequence
---

Arrange these steps in order.

?

- Receive the signal
- Transcribe the DNA
- Translate the mRNA
```

#### Quiz

A question with multiple-choice options, where the correct option is marked with `[x]`. During review the options are shuffled and the card is scored automatically based on your selection.

```markdown
---
card_type: quiz
---

What is the powerhouse of the cell?

?

- [ ] Nucleus
- [x] Mitochondrion
- [ ] Ribosome
```

#### Cloze

Text with one or more deletions written as `{{c1::answer}}` (optionally `{{c1::answer::hint}}`). During review each deletion is revealed one at a time; rate the card manually.

```markdown
---
card_type: cloze
---

The powerhouse of the cell is the {{c1::mitochondrion}}.
```

## Available Commands

| Context   | Command                    | Description                                                      |
| --------- | -------------------------- | ---------------------------------------------------------------- |
| Palette   | Open dashboard             | Open the learning dashboard                                      |
| Palette   | Create flashcard           | Open the flashcard form to create a new card                     |
| File menu | Create flashcard from file | Open the flashcard form pre-linked to the selected Markdown file |

---

## Contributing

```bash
yarn install
yarn dev       # development with hot reload
yarn test          # run the test suite
yarn lint      # lint TypeScript and Svelte files
yarn build     # production build
yarn format    # format code with Prettier
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
- **@dnd-kit/svelte** — Drag-and-drop for reordering sequence cards
- **layerchart** — Data visualization for the dashboard

---

## License

[MIT](https://github.com/Marco-Pozzecco/obs-knowledge-accelerator/blob/main/LICENSE.md) © 2026 Marco Pozzecco
