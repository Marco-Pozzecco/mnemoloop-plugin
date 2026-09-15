import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { envInt, machineInfo } from './perf';

export interface ReportRow {
	window: string;
	n: number;
	medianMs: number;
	msPerCard: number;
	budgetMs?: number;
	pass?: boolean;
	note?: string;
}

const rows: ReportRow[] = [];
function gitRevision(): string {
	try {
		return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
	} catch {
		return 'unknown';
	}
}

export function addRow(row: ReportRow): void {
	rows.push(row);
}

function markdown(suiteName: string): string {
	const lines = [
		`# ${suiteName}`,
		'',
		`- Generated: ${new Date().toISOString()}`,
		`- Node: ${machineInfo().node}`,
		`- CPU: ${machineInfo().cpu}`,
		`- Cores: ${machineInfo().cores}`,
		`- Platform: ${machineInfo().platform}`,
		`- Git revision: ${gitRevision()}`,
		`- Fixture mode: ${process.env.PERF_VAULT ?? 'memory'}`,
		'- Environment: Node 24.19.0; Vitest 1.6.1.',
		'',
		'| Window | N | Median (ms) | ms/card | Budget (ms) | Pass | Note |',
		'| --- | ---: | ---: | ---: | ---: | --- | --- |',
	];
	for (const row of rows) {
		lines.push(
			`| ${row.window} | ${row.n} | ${row.medianMs.toFixed(2)} | ${row.msPerCard.toFixed(6)} | ${row.budgetMs ?? ''} | ${row.pass === undefined ? '' : row.pass ? 'yes' : 'no'} | ${row.note ?? ''} |`,
		);
	}
	lines.push(
		'',
		'## Known limitations',
		'',
		'- Mode A uses an in-memory vault and under-reports real Obsidian I/O.',
		'- Vitest instrumentation adds roughly constant overhead; compare scaling across N.',
		'- Queue notes label the measurement path: instrumented rows use suppressed or serialized parser requests; unmodified rows use the full production event path.',
		'- Obsidian host startup, workspace restore, and Svelte rendering are out of scope.',
	);
	return `${lines.join('\n')}\n`;
}

export function emitReport(suiteName: string): { jsonPath: string; markdownPath: string } {
	const timestamp = new Date().toISOString();
	const safeSuite = suiteName.replace(/[^a-zA-Z0-9_-]/g, '-');
	const directory = path.resolve(process.cwd(), '../../.agents/handoff/plugin/perf');
	const jsonPath = path.join(directory, `${timestamp}-${safeSuite}.json`);
	const markdownPath = path.join(directory, `${timestamp}-${safeSuite}.md`);
	const document = {
		suite: suiteName,
		timestamp,
		machine: machineInfo(),
		gitRevision: gitRevision(),
		n: envInt('PERF_N', 50000),
		fixtureMode: process.env.PERF_VAULT ?? 'memory',
		rows,
	};
	const table = markdown(suiteName);
	console.log(table);
	try {
		fs.mkdirSync(directory, { recursive: true });
		fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);
		fs.writeFileSync(markdownPath, table);
	} catch (error) {
		console.error(`Unable to write performance report: ${String(error)}`);
	}
	return { jsonPath, markdownPath };
}

export function assertBudget(label: string, elapsedMs: number, budget: number): void {
	if (elapsedMs <= budget) return;
	const message = `${label} over budget: measured ${elapsedMs.toFixed(2)} ms, budget ${budget.toFixed(2)} ms, N=${envInt('PERF_N', 50000)}`;
	if (process.env.PERF_SOFT === '1') {
		console.warn(message);
		return;
	}
	throw new Error(message);
}
