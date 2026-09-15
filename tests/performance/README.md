# Performance tests

Run the performance suites from `apps/plugin/`:

```bash
PERF_N=500 npx vitest --run --config vitest.perf.config.ts
PERF_N=5000 npx vitest --run --config vitest.perf.config.ts
PERF_N=50000 npx vitest --run --config vitest.perf.config.ts
```

The suites measure both the cold startup path (`startup.indexing`) and the
second-startup path (`startup.indexing.warm`). The cold path has no persisted
`mnemoloop/flashcard-index.json`. The warm path seeds and schema-validates the
full persisted index before directory parsing. The warm report records the
index-file read and loaded entry count so a silently ignored seed cannot pass.

`PERF_N` controls the main fixture size (default `50000`). `PERF_RUNS` controls
measured runs (default `3`). `PERF_BUDGET_MS` controls the median budget
(default `2000`). Set `PERF_SOFT=1` to record an over-budget result without
failing the test. Set `PERF_WARMUP=1` to enable the warmup above 10,000 cards.
The default vault is an in-memory O(1)-lookup double.

Queue generation measures three paths after an untimed, initialized startup:

1. **Instrumented-suppressed materialization** (`queue.materialization`) patches
   the bus to drop parser requests. This isolates queue sorting and
   materialization at 50,000 cards without allocating the known N x N parser
   response fan-out. It is not user-visible latency. Its report Note starts
   with `instrumented=parser-requests-suppressed;`.
2. **Instrumented-serialized hydration** (`queue.hydration` and
   `queue.hydration.small`) serializes parser requests at concurrency 1. This
   keeps the parser and response path while bounding Promise allocation. It is
   also not the unmodified user-visible latency. Its Note starts with
   `instrumented=parser-requests-serialized(concurrency=1);`.
3. **Unmodified end-to-end** (`queue.endToEnd`) makes no bus patch. It builds
   the stack, runs startup, creates `FlashcardReviewQueue`, and waits for every
   item to have data. Its Note starts with `unmodified;`. The safe curve probes
   use N=100, 250, and 500. These values are verified safe in this
   environment and stay below the approximately 1.5 GB RSS safety target. N=1,000,
   2,000, and 5,000 are not safe on the measured machine and are known to risk
   OOM; do not run them. The
   default `PERF_E2E_N` is therefore 500. The safe extrapolation curve uses
   N=100, 250, and 500. The 50,000 end-to-end value is an extrapolation only,
   never a live allocation.

`PERF_QUEUE_CAP_MS` caps queue materialization (default `30000`).
`PERF_HYDRATION_CAP_MS` caps serialized hydration (default `10000`).
`PERF_E2E_CAP_MS` caps the unmodified end-to-end probe (default `10000`). On
cap expiry, the queue and stack are disposed before partial hydrated/total
counts are reported. `PERF_HYDRATION_SMALL_N` controls the always-on small
serialized probe (default `1000`). Set `PERF_HYDRATION=0` to skip the main
50,000-card serialized probe; the small probe still runs. Set `PERF_SCALING=1`
to report materialization at 1,000, 10,000, and 50,000 cards, including
milliseconds per card. A hydration cap failure is a valid result that reports
the hydrated count and fraction; it is not hidden or tuned away.

The startup spans include the awaited adapter and index initialization events
in the same order as `main.ts`: flashcard adapter, settings adapter, statistics
adapter, and flashcard index. Reports contain min, median, p95, machine data,
and sub-spans. They are written under `.agents/handoff/plugin/perf/` and also
printed as tables. Every queue run disposes its queue, event registry, and any
instrumentation patch.

Environment variables:

- `PERF_N` (default `50000`): main startup/materialization/hydration fixture size.
- `PERF_RUNS` (default `3`): measured runs per probe.
- `PERF_BUDGET_MS` (default `2000`): the unchanged median gate budget.
- `PERF_SOFT=1`: record an over-budget result without failing the gate.
- `PERF_WARMUP=1`: enable startup warmup above 10,000 cards.
- `PERF_VAULT` (default `memory`): fixture vault mode shown in reports.
- `PERF_QUEUE_CAP_MS` (default `30000`): materialization cap.
- `PERF_HYDRATION_CAP_MS` (default `10000`): serialized hydration cap.
- `PERF_HYDRATION_SMALL_N` (default `1000`): small serialized hydration size.
- `PERF_HYDRATION` (default `1`): set to `0` to skip the main hydration probe.
- `PERF_SCALING` (default off): set to `1` for materialization scaling rows.
- `PERF_E2E_N` (default `500`): unmodified end-to-end probe size; keep within
  the verified-safe range N=100--500. N=1,000 and above are not safe on the
  measured machine.
- `PERF_E2E_CAP_MS` (default `10000`): unmodified end-to-end cap.

The fixture parser intentionally supports only the flat frontmatter emitted by
the fixture. The in-memory vault under-reports real Obsidian I/O; host startup,
workspace restore, and Svelte rendering are outside these gates.
