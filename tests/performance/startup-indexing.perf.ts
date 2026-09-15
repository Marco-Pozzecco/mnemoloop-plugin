/// <reference types="vitest/globals" />
import { buildPerfStack, PerfStack } from './helpers/stack';
import { buildFixture } from './helpers/fixture';
import { assertBudget, addRow, emitReport } from './helpers/report';
import { budgetMs, envInt, measure } from './helpers/perf';
import type { Measurement } from './helpers/perf';
import { runStartupSequence } from './helpers/startup';
import type { StartupSpans } from './helpers/startup';

describe('performance: startup indexing', () => {
	it('indexes the fixture within the startup budget and remains correct', async () => {
		const count = envInt('PERF_N', 50000);
		const fixture = buildFixture({ count });
		const warmupEnabled = count <= 10000 || process.env.PERF_WARMUP === '1';

		if (warmupEnabled) {
			const warmup = await buildPerfStack(fixture);
			await runStartupSequence(warmup);
			warmup.dispose();
		}

		const runs = envInt('PERF_RUNS', 3);
		const stacks: PerfStack[] = [];
		for (let index = 0; index < runs; index += 1) {
			stacks.push(await buildPerfStack(fixture));
		}
		const spans: StartupSpans[] = [];
		let stackIndex = 0;
		const consoleErrors: unknown[] = [];
		const originalConsoleError = console.error;
		console.error = (...args: unknown[]) => {
			consoleErrors.push(args);
		};
		let measurement: Measurement;
		try {
			measurement = await measure(
				'startup.indexing',
				async () => {
					const stack = stacks[stackIndex++];
					const result = await runStartupSequence(stack);
					spans.push(result);
					stack.dispose();
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
		// Logger is configured OFF by setup.perf.ts. Any captured error is a parse failure path.
		const budget = budgetMs();
		const note = `unmodified; min=${measurement.min.toFixed(2)}ms; p95=${measurement.p95.toFixed(2)}ms; adapter.load=${lastSpans.adapterLoadMs.toFixed(2)}ms; index.init=${lastSpans.indexInitMs.toFixed(2)}ms; index.parseDir=${lastSpans.parseDirMs.toFixed(2)}ms; index.save=${lastSpans.saveMs.toFixed(2)}ms`;
		addRow({
			window: 'startup.indexing',
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
			assertBudget('startup.indexing', measurement.median, budget);
		} catch (error) {
			failure = error;
		} finally {
			emitReport('startup-indexing');
		}
		if (failure) throw failure;
	}, 600000);
});
