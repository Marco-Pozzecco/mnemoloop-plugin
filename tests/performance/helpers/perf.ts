import os from 'node:os';

export function now(): number {
	return performance.now();
}

export async function settle(yields = 1): Promise<void> {
	for (let index = 0; index < yields; index += 1) await Promise.resolve();
	if (yields > 0) await new Promise<void>((resolve) => setImmediate(resolve));
}

export async function waitUntil(
	pred: () => boolean,
	opts: { timeoutMs: number; label?: string },
): Promise<{ ok: boolean; elapsedMs: number }> {
	const started = now();
	while (!pred()) {
		if (now() - started >= opts.timeoutMs) {
			return { ok: false, elapsedMs: now() - started };
		}
		await settle(1);
	}
	return { ok: true, elapsedMs: now() - started };
}

export interface Measurement {
	label: string;
	runs: number[];
	min: number;
	median: number;
	p95: number;
}

function percentile(values: number[], fraction: number): number {
	const sorted = [...values].sort((a, b) => a - b);
	const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
	return sorted[index];
}

export async function measure<T>(
	label: string,
	fn: () => Promise<T>,
	opts: { runs?: number; warmup?: boolean } = {},
): Promise<Measurement> {
	const runs = opts.runs ?? envInt('PERF_RUNS', 3);
	if (opts.warmup) await fn();
	const samples: number[] = [];
	for (let index = 0; index < runs; index += 1) {
		const started = now();
		await fn();
		samples.push(now() - started);
	}
	return {
		label,
		runs: samples,
		min: Math.min(...samples),
		median: percentile(samples, 0.5),
		p95: percentile(samples, 0.95),
	};
}

export function envInt(name: string, fallback: number): number {
	const parsed = Number.parseInt(process.env[name] ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function budgetMs(): number {
	return envInt('PERF_BUDGET_MS', 2000);
}

export function machineInfo(): { node: string; cpu: string; cores: number; platform: string } {
	return {
		node: process.version,
		cpu: os.cpus()[0]?.model ?? 'unknown',
		cores: os.cpus().length,
		platform: `${process.platform}-${process.arch}`,
	};
}
