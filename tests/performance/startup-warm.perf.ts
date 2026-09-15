/// <reference types="vitest/globals" />
import { buildPerfStack, PerfStack } from './helpers/stack';
import { buildFixture } from './helpers/fixture';
import { assertBudget, addRow, emitReport } from './helpers/report';
import { budgetMs, envInt, measure } from './helpers/perf';
import type { Measurement } from './helpers/perf';
import { runStartupSequence } from './helpers/startup';
import type { StartupSpans } from './helpers/startup';

const INDEX_PATH = 'mnemoloop/flashcard-index.json';

describe('performance: warm startup indexing', () => {
	it('loads and validates a persisted index before indexing the fixture', async () => {
		const count = envInt('PERF_N', 50000);
		const fixture = buildFixture({ count });
		const warmupEnabled = count <= 10000 || process.env.PERF_WARMUP === '1';

		if (warmupEnabled) {
			const warmup = await buildPerfStack(fixture, { seedIndex: true });
			await runStartupSequence(warmup);
			warmup.dispose();
		}

		const runs = envInt('PERF_RUNS', 3);
		const stacks: PerfStack[] = [];
		for (let index = 0; index < runs; index += 1) {
			stacks.push(await buildPerfStack(fixture, { seedIndex: true }));
		}
		const spans: StartupSpans[] = [];
		const parseDirObservations: { readIndex: boolean; entries: number }[] = [];
		let stackIndex = 0;
		const consoleErrors: unknown[] = [];
		const originalConsoleError = console.error;
		console.error = (...args: unknown[]) => {
			consoleErrors.push(args);
		};
		let measurement: Measurement;
		try {
			measurement = await measure(
				'startup.indexing.warm',
				async () => {
					const stack = stacks[stackIndex++];
					const originalParseDir = stack.parser.parseDir;
					stack.parser.parseDir = async (dirPath: string) => {
						parseDirObservations.push({
							readIndex: stack.vault.stats.readPaths.includes(INDEX_PATH),
							entries: stack.flashcardAdapter.data.flashcards.length,
						});
						return await originalParseDir(dirPath);
					};
					try {
						const result = await runStartupSequence(stack);
						spans.push(result);
					} finally {
						stack.parser.parseDir = originalParseDir;
						stack.dispose();
					}
				},
				{ runs, warmup: false },
			);
		} finally {
			console.error = originalConsoleError;
		}

		const lastStack = stacks[stacks.length - 1];
		const lastSpans = spans[spans.length - 1];
		const uuids = lastStack.indexer.getAll().map((card: { uuid: string }) => card.uuid);
		const indexWrites = [...lastStack.vault.writes.keys()].filter((file) =>
			file.endsWith('/flashcard-index.json'),
		);
		const budget = budgetMs();
		const note = `unmodified; min=${measurement.min.toFixed(2)}ms; p95=${measurement.p95.toFixed(2)}ms; adapter.load=${lastSpans.adapterLoadMs.toFixed(2)}ms; index.init=${lastSpans.indexInitMs.toFixed(2)}ms; index.parseDir=${lastSpans.parseDirMs.toFixed(2)}ms; index.save=${lastSpans.saveMs.toFixed(2)}ms; seeded.read=${parseDirObservations.every((observation) => observation.readIndex)}; seeded.entries=${parseDirObservations.map((observation) => observation.entries).join(',')}`;
		addRow({
			window: 'startup.indexing.warm',
			n: count,
			medianMs: measurement.median,
			msPerCard: measurement.median / count,
			budgetMs: budget,
			pass: measurement.median <= budget,
			note,
		});

		let failure: unknown;
		try {
			expect(lastStack.indexer.size).toBe(count);
			expect(new Set(uuids).size).toBe(count);
			expect(spans.reduce((total, run) => total + run.parseFailures, 0)).toBe(0);
			expect(consoleErrors).toHaveLength(0);
			expect(indexWrites).toHaveLength(1);
			expect(parseDirObservations).toHaveLength(runs);
			for (const observation of parseDirObservations) {
				expect(observation.readIndex).toBe(true);
				expect(observation.entries).toBe(count);
			}
			assertBudget('startup.indexing.warm', measurement.median, budget);
		} catch (error) {
			failure = error;
		} finally {
			emitReport('startup-indexing-warm');
		}
		if (failure) throw failure;
	}, 600000);
});
