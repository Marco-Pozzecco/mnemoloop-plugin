import {
	FlashcardAdapterInitEvent,
	FlashcardIndexInitEvent,
	SettingsAdapterInitEvent,
	StatisticsAdapterInitEvent,
} from '@/modules/events';
import type { PerfStack } from './stack';
import { now } from './perf';

export interface StartupSpans {
	totalMs: number;
	adapterLoadMs: number;
	indexInitMs: number;
	parseDirMs: number;
	saveMs: number;
	parseFailures: number;
}

export async function runStartupSequence(stack: PerfStack): Promise<StartupSpans> {
	const spans: StartupSpans = {
		totalMs: 0,
		adapterLoadMs: 0,
		indexInitMs: 0,
		parseDirMs: 0,
		saveMs: 0,
		parseFailures: 0,
	};
	const originalParseDir = stack.parser.parseDir;
	const originalSave = stack.indexer.save;
	stack.parser.parseDir = async (dirPath: string) => {
		const started = now();
		try {
			const result = await originalParseDir(dirPath);
			spans.parseFailures += result.filter((item: { success: boolean }) => !item.success).length;
			return result;
		} finally {
			spans.parseDirMs += now() - started;
		}
	};
	stack.indexer.save = async () => {
		const started = now();
		try {
			return await originalSave();
		} finally {
			spans.saveMs += now() - started;
		}
	};

	try {
		const started = now();
		const adapterStarted = now();
		await stack.bus.publish(new FlashcardAdapterInitEvent());
		spans.adapterLoadMs = now() - adapterStarted;
		await stack.bus.publish(new SettingsAdapterInitEvent());
		await stack.bus.publish(new StatisticsAdapterInitEvent());
		const indexStarted = now();
		await stack.bus.publish(new FlashcardIndexInitEvent());
		spans.indexInitMs = now() - indexStarted;
		spans.totalMs = now() - started;
		return spans;
	} finally {
		stack.parser.parseDir = originalParseDir;
		stack.indexer.save = originalSave;
	}
}
