import { describe, expect, it, vi } from 'vitest';
import { Plugin } from 'obsidian';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { DEFAULT_STATISTICS, Stats } from '@/schemas/statistics';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

const VALID_SESSION = {
	session_id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
	date: '2026-08-19',
	review_type: 'basic',
	start_time: 1000,
	end_time: 2000,
	total_count: 2,
	correct_count: 2,
	incorrect_count: 0,
	duration_s: 60,
};

function createValidStats(): Stats {
	return {
		progress: {
			'2026-08-19': {
				total_count: 2,
				correct_count: 2,
				incorrect_count: 0,
				retention_rate: 1,
				sessions_completed: 1,
				total_duration: 120,
				goal_completed: false,
			},
		},
		sessions: [VALID_SESSION],
		flashcard: { ...DEFAULT_STATISTICS.flashcard },
		updated_at: '2026-08-20T10:00:00.000Z',
	};
}

interface AdapterHarness {
	adapter: StatisticsAdapter;
	loadData: ReturnType<typeof vi.fn>;
	saveData: ReturnType<typeof vi.fn>;
}

/** Plugin mock whose `data.json` payload is returned by `plugin.loadData()`. */
function createHarness(data: unknown = null): AdapterHarness {
	const plugin = createMockPlugin([]) as Record<string, unknown>;
	const loadData = vi.fn().mockResolvedValue(data);
	const saveData = vi.fn().mockResolvedValue(undefined);
	plugin.loadData = loadData;
	plugin.saveData = saveData;
	return {
		adapter: new StatisticsAdapter(plugin as unknown as Plugin),
		loadData,
		saveData,
	};
}

function callLoadData(adapter: StatisticsAdapter): Promise<unknown> {
	return (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();
}

function callSaveData(adapter: StatisticsAdapter, data: Stats): Promise<void> {
	return (adapter as unknown as Record<string, (d: Stats) => Promise<void>>).saveData(data);
}

describe('StatisticsAdapter', () => {
	describe('constructor', () => {
		it('should initialize with default statistics', () => {
			const { adapter } = createHarness();
			expect(adapter.data).toEqual(DEFAULT_STATISTICS);
		});
	});

	describe('loadData', () => {
		it('should return the statistics entry from the data.json envelope', async () => {
			const stats = createValidStats();
			const { adapter, loadData } = createHarness({
				settings: { marker: true },
				statistics: stats,
			});

			const data = await callLoadData(adapter);

			expect(loadData).toHaveBeenCalled();
			expect(data).toEqual(stats);
		});

		it('should return undefined when no data is stored', async () => {
			const { adapter } = createHarness(null);

			const data = await callLoadData(adapter);

			expect(data).toBeUndefined();
		});

		it('should return undefined when the envelope has no statistics entry', async () => {
			const { adapter } = createHarness({ settings: { marker: true } });

			const data = await callLoadData(adapter);

			expect(data).toBeUndefined();
		});

		it('should propagate a load error', async () => {
			const { adapter, loadData } = createHarness(null);
			loadData.mockRejectedValue(new Error('load failed'));

			await expect(callLoadData(adapter)).rejects.toThrow('load failed');
		});
	});

	describe('saveData', () => {
		it('should merge statistics into the envelope and keep settings', async () => {
			const stats = createValidStats();
			const { adapter, saveData } = createHarness({ settings: { marker: true } });

			await callSaveData(adapter, stats);

			expect(saveData).toHaveBeenCalledWith({
				settings: { marker: true },
				statistics: stats,
			});
		});

		it('should create the envelope when no data exists', async () => {
			const stats = createValidStats();
			const { adapter, saveData } = createHarness(null);

			await callSaveData(adapter, stats);

			expect(saveData).toHaveBeenCalledWith({ statistics: stats });
		});
	});

	describe('initialize', () => {
		it('should load statistics from data.json without writing', async () => {
			const stats = createValidStats();
			const { adapter, saveData } = createHarness({
				settings: { marker: true },
				statistics: stats,
			});

			await adapter.initialize();

			expect(adapter.data).toEqual(stats);
			expect(adapter.initialized).toBe(true);
			expect(saveData).not.toHaveBeenCalled();
		});

		it('should seed defaults when the statistics entry is absent', async () => {
			const { adapter, saveData } = createHarness(null);

			await adapter.initialize();

			expect(adapter.data).toEqual(DEFAULT_STATISTICS);
			expect(adapter.initialized).toBe(true);
			expect(saveData).toHaveBeenCalledTimes(1);
			expect(saveData).toHaveBeenCalledWith({ statistics: DEFAULT_STATISTICS });
		});

		it('should keep defaults in memory and not write when loading fails', async () => {
			const { adapter, loadData, saveData } = createHarness(null);
			loadData.mockRejectedValue(new Error('failed to parse data.json'));

			await adapter.initialize();

			expect(adapter.data).toEqual(DEFAULT_STATISTICS);
			expect(adapter.initialized).toBe(true);
			expect(saveData).not.toHaveBeenCalled();
		});
	});

	describe('initialize — non-destructive recovery', () => {
		it('should drop only the invalid session and persist the repair', async () => {
			const stats = createValidStats();
			stats.sessions = [
				VALID_SESSION,
				{ ...VALID_SESSION, session_id: 'b7f5a1e2-0c3d-4e5f-8a9b-1c2d3e4f5a6b', end_time: 500 },
			];
			const { adapter, saveData } = createHarness({
				settings: { marker: true },
				statistics: stats,
			});

			await adapter.initialize();

			expect(adapter.data.sessions).toHaveLength(1);
			expect(adapter.data.progress).toEqual(stats.progress);
			expect(adapter.data.flashcard).toEqual(stats.flashcard);
			expect(saveData).toHaveBeenCalledTimes(1);
			const written = saveData.mock.calls[0][0] as { settings: unknown; statistics: Stats };
			expect(written.settings).toEqual({ marker: true });
			expect(written.statistics.sessions).toHaveLength(1);
		});

		it('should drop only the invalid progress day and keep the others', async () => {
			const stats = createValidStats();
			stats.progress['2026-08-20'] = {
				...stats.progress['2026-08-19'],
				total_count: -1,
			};
			const { adapter, saveData } = createHarness({ statistics: stats });

			await adapter.initialize();

			expect(adapter.data.progress).toEqual({
				'2026-08-19': stats.progress['2026-08-19'],
			});
			expect(adapter.data.sessions).toHaveLength(1);
			expect(saveData).toHaveBeenCalledTimes(1);
		});

		it('should substitute the default for an invalid scalar field', async () => {
			const stats = createValidStats();
			stats.flashcard.retention_rate = 5;
			const { adapter, saveData } = createHarness({ statistics: stats });

			await adapter.initialize();

			expect(adapter.data.flashcard.retention_rate).toBe(0);
			expect(adapter.data.sessions).toHaveLength(1);
			expect(adapter.data.progress).toEqual(stats.progress);
			expect(saveData).toHaveBeenCalledTimes(1);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should save data via save method', async () => {
			const stats = createValidStats();
			const { adapter, saveData } = createHarness({ settings: { marker: true } });
			adapter.set(stats);

			await adapter.save();

			expect(saveData).toHaveBeenCalledWith({
				settings: { marker: true },
				statistics: stats,
			});
		});
	});
});
