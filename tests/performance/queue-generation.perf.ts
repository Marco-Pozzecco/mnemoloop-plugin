/// <reference types="vitest/globals" />
import { CardStatus, FlashcardMetadata } from '@/schemas';
import { FlashcardParserParseRequestEvent } from '@/modules/events';
import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';
import { buildFixture, PerfFixture } from './helpers/fixture';
import { buildPerfStack, PerfStack } from './helpers/stack';
import { runStartupSequence } from './helpers/startup';
import { addRow, assertBudget, emitReport } from './helpers/report';
import { budgetMs, envInt, measure, now, waitUntil } from './helpers/perf';
import type { Measurement } from './helpers/perf';

const DEFAULT_QUEUE_CAP_MS = 30000;
const INDEXED_CARD_SAMPLE_SIZE = 100;

type PerfQueue = FlashcardReviewQueue;

interface QueueMaterializationTimeout {
	elapsedMs: number;
	partialSize: number;
}

interface HydrationProbeResult {
	elapsedMs: number;
	hydratedCount: number;
	total: number;
	timedOut: boolean;
}

function duePredicate(entity: FlashcardMetadata): boolean {
	return entity.status === CardStatus.ACTIVE && new Date(entity.due) <= new Date();
}

function queueDue(queue: PerfQueue, fixture: PerfFixture): number[] {
	const cardsByPath = new Map(fixture.cards.map((card) => [card.path, card]));
	return queue.items.map((item) => {
		const card = cardsByPath.get(item.filepath);
		return card ? new Date(card.due).getTime() : Number.NaN;
	});
}

function assertMaterializedQueue(queue: PerfQueue, fixture: PerfFixture, count: number): void {
	expect(queue.size).toBe(count);
	const dueValues = queueDue(queue, fixture);
	expect(dueValues.every((due) => Number.isFinite(due))).toBe(true);
	for (let index = 1; index < dueValues.length; index += 1) {
		expect(dueValues[index]).toBeGreaterThanOrEqual(dueValues[index - 1]);
	}
	const earliest = fixture.cards.reduce((current, card) =>
		new Date(card.due) < new Date(current.due) ? card : current,
	);
	expect(queue.current?.filepath).toBe(earliest.path);
}

function suppressParserRequests(stack: PerfStack): () => void {
	const originalPublish = stack.bus.publish;
	stack.bus.publish = async (event: { type: string; id: string }) => {
		if (event.type === FlashcardParserParseRequestEvent.type) return event.id;
		return await originalPublish.call(stack.bus, event);
	};
	return () => {
		stack.bus.publish = originalPublish;
	};
}

/**
 * Keep the large hydration probe bounded. The production queue fires one parser
 * request per item, and each response is observed by every item. Serializing
 * those requests preserves the parser and response path while preventing all
 * N x N Promise.all allocations from being created before the cap can run.
 */
function serializeParserRequests(stack: PerfStack): () => void {
	const originalPublish = stack.bus.publish;
	const pending: {
		event: { type: string; id: string };
		resolve: (id: string) => void;
		reject: (error: unknown) => void;
	}[] = [];
	const concurrency = 1;
	let active = 0;
	let stopped = false;
	const pump = (): void => {
		while (!stopped && active < concurrency && pending.length > 0) {
			const task = pending.shift()!;
			active += 1;
			void Promise.resolve()
				.then(() => originalPublish.call(stack.bus, task.event))
				.then(task.resolve, task.reject)
				.finally(() => {
					active -= 1;
					setImmediate(pump);
				});
		}
	};
	stack.bus.publish = (event: { type: string; id: string }) => {
		if (event.type !== FlashcardParserParseRequestEvent.type) {
			return originalPublish.call(stack.bus, event);
		}
		if (stopped) return Promise.resolve(event.id);
		return new Promise<string>((resolve, reject) => {
			pending.push({ event, resolve, reject });
			pump();
		});
	};
	return () => {
		stopped = true;
		for (const task of pending.splice(0)) task.resolve(task.event.id);
		stack.bus.publish = originalPublish;
	};
}

function assertHydratedSample(queue: PerfQueue, fixture: PerfFixture): void {
	const cardsByPath = new Map(fixture.cards.map((card) => [card.path, card]));
	const sample = queue.items.slice(0, Math.min(INDEXED_CARD_SAMPLE_SIZE, queue.size));
	expect(sample).toHaveLength(Math.min(INDEXED_CARD_SAMPLE_SIZE, queue.size));
	for (const item of sample) {
		const expected = cardsByPath.get(item.filepath);
		expect(expected).toBeDefined();
		expect(item.data).not.toBeNull();
		const content = (item.data as unknown as { content: { front: string; back: string } }).content;
		expect(content.front).toBe(expected?.front);
		expect(content.back).toBe(expected?.back);
	}
}

async function runMaterializationOnce(fixture: PerfFixture, count: number): Promise<number> {
	const stack = await buildPerfStack(fixture);
	let queue: PerfQueue | undefined;
	const restorePublish = suppressParserRequests(stack);
	try {
		await runStartupSequence(stack);
		const started = now();
		queue = new FlashcardReviewQueue(duePredicate);
		const result = await waitUntil(() => queue!.size === count, {
			timeoutMs: envInt('PERF_QUEUE_CAP_MS', DEFAULT_QUEUE_CAP_MS),
			label: 'queue materialization',
		});
		const elapsedMs = now() - started;
		if (!result.ok) {
			const partialSize = queue.size;
			throw Object.assign(
				new Error(
					`queue.materialization cap expired: partial size ${partialSize}/${count} after ${elapsedMs.toFixed(2)} ms`,
				),
				{
					queueMaterializationTimeout: {
						elapsedMs,
						partialSize,
					} satisfies QueueMaterializationTimeout,
				},
			);
		}
		assertMaterializedQueue(queue, fixture, count);
		return elapsedMs;
	} finally {
		queue?.dispose();
		stack.dispose();
		restorePublish();
	}
}

async function runHydrationOnce(
	fixture: PerfFixture,
	count: number,
	checkSample: boolean,
): Promise<HydrationProbeResult> {
	const stack = await buildPerfStack(fixture);
	let queue: PerfQueue | undefined;
	const restorePublish = serializeParserRequests(stack);
	try {
		await runStartupSequence(stack);
		const started = now();
		queue = new FlashcardReviewQueue(duePredicate);
		const result = await waitUntil(
			() => queue!.size === count && queue!.items.every((item) => item.data !== null),
			{
				timeoutMs: envInt('PERF_HYDRATION_CAP_MS', 10000),
				label: 'queue hydration',
			},
		);
		const elapsedMs = now() - started;
		const hydratedCount = queue.items.filter((item) => item.data !== null).length;
		const total = queue.size;
		if (!result.ok) {
			// Dispose before any further await. Pending N x N events must lose all listeners now.
			queue.dispose();
			stack.dispose();
			return { elapsedMs, hydratedCount, total, timedOut: true };
		}
		if (checkSample) assertHydratedSample(queue, fixture);
		return { elapsedMs, hydratedCount, total, timedOut: false };
	} finally {
		if (queue) queue.dispose();
		stack.dispose();
		restorePublish();
	}
}

interface ProbeMeasurement {
	runs: number[];
	min: number;
	median: number;
	p95: number;
	timeout?: HydrationProbeResult;
}

interface EndToEndProbeResult extends HydrationProbeResult {
	peakRssBytes: number;
}

interface EndToEndMeasurement extends ProbeMeasurement {
	peakRssBytes: number[];
}

interface EndToEndCurvePoint {
	count: number;
	measurement: EndToEndMeasurement;
}

const DEFAULT_END_TO_END_SAFE_N = 500;
const DEFAULT_END_TO_END_CURVE_COUNTS = [100, 250, DEFAULT_END_TO_END_SAFE_N];
const EXTRAPOLATED_END_TO_END_COUNT = 50000;

function rssBytes(): number {
	return process.memoryUsage().rss;
}

/**
 * Measure the queue with the production event path unchanged. In particular,
 * do not patch parser requests or response fan-out here: this is the user-visible
 * end-to-end probe, including the production N x N event-handler behavior.
 */
async function runEndToEndOnce(fixture: PerfFixture, count: number): Promise<EndToEndProbeResult> {
	const stack = await buildPerfStack(fixture);
	let queue: PerfQueue | undefined;
	let queueDisposed = false;
	let stackDisposed = false;
	let peakRssBytes = rssBytes();
	const sampleRss = (): void => {
		peakRssBytes = Math.max(peakRssBytes, rssBytes());
	};
	const rssMonitor = setInterval(sampleRss, 10);
	const disposeNow = (): void => {
		if (!queueDisposed) {
			queue?.dispose();
			queueDisposed = true;
		}
		if (!stackDisposed) {
			stack.dispose();
			stackDisposed = true;
		}
	};

	try {
		await runStartupSequence(stack);
		const started = now();
		queue = new FlashcardReviewQueue(duePredicate);
		const result = await waitUntil(
			() => queue!.size === count && queue!.items.every((item) => item.data !== null),
			{
				timeoutMs: envInt('PERF_E2E_CAP_MS', 10000),
				label: 'queue end-to-end hydration',
			},
		);
		sampleRss();
		const elapsedMs = now() - started;
		const hydratedCount = queue.items.filter((item) => item.data !== null).length;
		const total = queue.size;
		if (!result.ok) {
			// Dispose before returning partial evidence so pending fan-out cannot keep the process alive.
			disposeNow();
			return { elapsedMs, hydratedCount, total, timedOut: true, peakRssBytes };
		}
		return { elapsedMs, hydratedCount, total, timedOut: false, peakRssBytes };
	} finally {
		clearInterval(rssMonitor);
		sampleRss();
		disposeNow();
	}
}

async function measureHydration(
	fixture: PerfFixture,
	count: number,
	runs: number,
	checkSample: boolean,
): Promise<ProbeMeasurement> {
	const samples: number[] = [];
	let timeout: HydrationProbeResult | undefined;
	for (let index = 0; index < runs; index += 1) {
		const result = await runHydrationOnce(fixture, count, checkSample);
		samples.push(result.elapsedMs);
		if (result.timedOut) {
			timeout = result;
			break;
		}
	}
	const sorted = [...samples].sort((a, b) => a - b);
	const percentile95 =
		sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1))];
	return {
		runs: samples,
		min: Math.min(...samples),
		median: sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.5) - 1))],
		p95: percentile95,
		timeout,
	};
}

async function measureEndToEnd(
	fixture: PerfFixture,
	count: number,
	runs: number,
): Promise<EndToEndMeasurement> {
	const samples: number[] = [];
	const peakRssBytes: number[] = [];
	let timeout: HydrationProbeResult | undefined;
	for (let index = 0; index < runs; index += 1) {
		const result = await runEndToEndOnce(fixture, count);
		samples.push(result.elapsedMs);
		peakRssBytes.push(result.peakRssBytes);
		if (result.timedOut) {
			timeout = result;
			break;
		}
	}
	const sorted = [...samples].sort((a, b) => a - b);
	const percentile95 =
		sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1))];
	return {
		runs: samples,
		min: Math.min(...samples),
		median: sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.5) - 1))],
		p95: percentile95,
		timeout,
		peakRssBytes,
	};
}

function materializationNote(measurement: Measurement): string {
	return `instrumented=parser-requests-suppressed; min=${measurement.min.toFixed(2)}ms; p95=${measurement.p95.toFixed(2)}ms`;
}

function hydrationNote(measurement: ProbeMeasurement): string {
	const note = `instrumented=parser-requests-serialized(concurrency=1); min=${measurement.min.toFixed(2)}ms; p95=${measurement.p95.toFixed(2)}ms; runs=${measurement.runs.length}`;
	if (!measurement.timeout) return note;
	return `${note}; cap=${measurement.timeout.elapsedMs.toFixed(2)}ms; hydrated=${measurement.timeout.hydratedCount}/${measurement.timeout.total}`;
}

function rssMegabytes(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function endToEndNote(measurement: EndToEndMeasurement, curve: EndToEndCurvePoint[]): string {
	const rssTable = curve
		.map(
			({ count, measurement: curveMeasurement }) =>
				`N=${count}:${curveMeasurement.peakRssBytes.map(rssMegabytes).join(',')}`,
		)
		.join('; ');
	const note = `unmodified; min=${measurement.min.toFixed(2)}ms; p95=${measurement.p95.toFixed(2)}ms; runs=${measurement.runs.length}; peak-rss=${measurement.peakRssBytes.map(rssMegabytes).join(',')}; rss-table=${rssTable}`;
	if (!measurement.timeout) return note;
	return `${note}; cap=${measurement.timeout.elapsedMs.toFixed(2)}ms; hydrated=${measurement.timeout.hydratedCount}/${measurement.timeout.total}`;
}

function extrapolateEndToEnd(points: EndToEndCurvePoint[]):
	| {
			medianMs: number;
			note: string;
	  }
	| undefined {
	const completed = points.filter(
		({ measurement }) => !measurement.timeout && measurement.runs.length > 0,
	);
	if (completed.length < 3) return undefined;

	// Queue response fan-out is quadratic in N. Fit the measured medians against N²,
	// then evaluate that curve at 50,000. This keeps the extrapolation explicit and
	// does not turn an unmeasured, potentially unsafe run into a gate.
	const samples = completed.map(({ count, measurement }) => ({
		x: count * count,
		y: measurement.median,
	}));
	const meanX = samples.reduce((sum, sample) => sum + sample.x, 0) / samples.length;
	const meanY = samples.reduce((sum, sample) => sum + sample.y, 0) / samples.length;
	const denominator = samples.reduce((sum, sample) => sum + (sample.x - meanX) ** 2, 0);
	if (denominator === 0) return undefined;
	const slope =
		samples.reduce((sum, sample) => sum + (sample.x - meanX) * (sample.y - meanY), 0) / denominator;
	const intercept = meanY - slope * meanX;
	const extrapolatedMs = Math.max(0, intercept + slope * EXTRAPOLATED_END_TO_END_COUNT ** 2);
	const basis = completed
		.map(({ count, measurement }) => `${count}:${measurement.median.toFixed(2)}ms`)
		.join(', ');
	return {
		medianMs: extrapolatedMs,
		note: `extrapolated; fit=median vs N²; basis=${basis}; evaluated at N=${EXTRAPOLATED_END_TO_END_COUNT}`,
	};
}

describe('performance: queue generation', () => {
	it('materializes and hydrates the due queue within the queue budgets', async () => {
		const count = envInt('PERF_N', 50000);
		const runs = envInt('PERF_RUNS', 3);
		const fixture = buildFixture({ count });
		const budget = budgetMs();
		let failure: unknown;

		try {
			let materialization: Measurement;
			try {
				materialization = await measure(
					'queue.materialization',
					() => runMaterializationOnce(fixture, count),
					{ runs, warmup: false },
				);
				addRow({
					window: 'queue.materialization',
					n: count,
					medianMs: materialization.median,
					msPerCard: materialization.median / count,
					budgetMs: budget,
					pass: materialization.median <= budget,
					note: materializationNote(materialization),
				});
				try {
					assertBudget('queue.materialization', materialization.median, budget);
				} catch (error) {
					failure = error;
				}
			} catch (error) {
				failure = error;
			}

			if (process.env.PERF_SCALING === '1') {
				const scalingMeasurements: { count: number; measurement: Measurement }[] = [];
				for (const scalingCount of [1000, 10000, 50000]) {
					const scalingFixture = buildFixture({ count: scalingCount });
					const scalingMeasurement = await measure(
						`queue.materialization.scaling.${scalingCount}`,
						() => runMaterializationOnce(scalingFixture, scalingCount),
						{ runs, warmup: false },
					);
					scalingMeasurements.push({ count: scalingCount, measurement: scalingMeasurement });
				}
				const baseline = scalingMeasurements.find(
					({ count: scalingCount }) => scalingCount === 1000,
				);
				const largest = scalingMeasurements.find(
					({ count: scalingCount }) => scalingCount === 50000,
				);
				for (const {
					count: scalingCount,
					measurement: scalingMeasurement,
				} of scalingMeasurements) {
					const baselineMsPerCard = baseline ? baseline.measurement.median / 1000 : undefined;
					const msPerCard = scalingMeasurement.median / scalingCount;
					const warning =
						scalingCount === 50000 &&
						largest &&
						baselineMsPerCard &&
						msPerCard > baselineMsPerCard * 3
							? `WARNING: 50k ms/card ${msPerCard.toFixed(6)} exceeds 3x 1k ${baselineMsPerCard.toFixed(6)}; `
							: '';
					addRow({
						window: `queue.materialization.scaling.${scalingCount}`,
						n: scalingCount,
						medianMs: scalingMeasurement.median,
						msPerCard,
						note: materializationNote(scalingMeasurement) + (warning ? `; ${warning}` : ''),
					});
				}
			}

			if (process.env.PERF_HYDRATION !== '0') {
				const hydration = await measureHydration(fixture, count, runs, true);
				addRow({
					window: 'queue.hydration',
					n: count,
					medianMs: hydration.median,
					msPerCard: hydration.median / count,
					budgetMs: budget,
					pass: !hydration.timeout && hydration.median <= budget,
					note: hydrationNote(hydration),
				});
				if (hydration.timeout) {
					failure ??= new Error(
						`queue.hydration cap expired: hydrated ${hydration.timeout.hydratedCount}/${hydration.timeout.total} after ${hydration.timeout.elapsedMs.toFixed(2)} ms`,
					);
				} else {
					try {
						assertBudget('queue.hydration', hydration.median, budget);
					} catch (error) {
						failure ??= error;
					}
				}
			}

			const hydrationSmallCount = envInt('PERF_HYDRATION_SMALL_N', 1000);
			const hydrationSmall = await measureHydration(
				buildFixture({ count: hydrationSmallCount }),
				hydrationSmallCount,
				runs,
				true,
			);
			addRow({
				window: 'queue.hydration.small',
				n: hydrationSmallCount,
				medianMs: hydrationSmall.median,
				msPerCard: hydrationSmall.median / hydrationSmallCount,
				budgetMs: budget,
				pass: !hydrationSmall.timeout && hydrationSmall.median <= budget,
				note: hydrationNote(hydrationSmall),
			});
			if (hydrationSmall.timeout) {
				failure ??= new Error(
					`queue.hydration.small cap expired: hydrated ${hydrationSmall.timeout.hydratedCount}/${hydrationSmall.timeout.total} after ${hydrationSmall.timeout.elapsedMs.toFixed(2)} ms`,
				);
			} else {
				try {
					assertBudget('queue.hydration.small', hydrationSmall.median, budget);
				} catch (error) {
					failure ??= error;
				}
			}

			const endToEndCount = envInt('PERF_E2E_N', DEFAULT_END_TO_END_SAFE_N);
			const endToEndCounts = [...new Set([...DEFAULT_END_TO_END_CURVE_COUNTS, endToEndCount])];
			const endToEndCurve: EndToEndCurvePoint[] = [];
			for (const curveCount of endToEndCounts) {
				const curveFixture =
					curveCount === fixture.count ? fixture : buildFixture({ count: curveCount });
				const curveMeasurement = await measureEndToEnd(curveFixture, curveCount, runs);
				endToEndCurve.push({ count: curveCount, measurement: curveMeasurement });
			}
			const endToEnd = endToEndCurve.find(({ count: curveCount }) => curveCount === endToEndCount);
			if (!endToEnd) throw new Error(`Missing queue.endToEnd measurement for N=${endToEndCount}`);
			addRow({
				window: 'queue.endToEnd',
				n: endToEndCount,
				medianMs: endToEnd.measurement.median,
				msPerCard: endToEnd.measurement.median / endToEndCount,
				budgetMs: budget,
				pass: !endToEnd.measurement.timeout && endToEnd.measurement.median <= budget,
				note: endToEndNote(endToEnd.measurement, endToEndCurve),
			});
			if (endToEnd.measurement.timeout) {
				failure ??= new Error(
					`queue.endToEnd cap expired: hydrated ${endToEnd.measurement.timeout.hydratedCount}/${endToEnd.measurement.timeout.total} after ${endToEnd.measurement.timeout.elapsedMs.toFixed(2)} ms`,
				);
			} else {
				try {
					assertBudget('queue.endToEnd', endToEnd.measurement.median, budget);
				} catch (error) {
					failure ??= error;
				}
			}

			const extrapolated = extrapolateEndToEnd(endToEndCurve);
			if (extrapolated) {
				addRow({
					window: 'queue.endToEnd.extrapolated',
					n: EXTRAPOLATED_END_TO_END_COUNT,
					medianMs: extrapolated.medianMs,
					msPerCard: extrapolated.medianMs / EXTRAPOLATED_END_TO_END_COUNT,
					note: extrapolated.note,
				});
			}
		} catch (error) {
			failure ??= error;
		} finally {
			emitReport('queue-generation');
		}
		if (failure) throw failure;
	}, 600000);
});
