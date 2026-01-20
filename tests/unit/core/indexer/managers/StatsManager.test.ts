import { CardMetadata } from '@/core/indexer';
import { CardStatus } from '@/core/parser';
import { StatisticsManager } from '@/core/statistics/StatisticsManager';
import { App } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Obsidian App
const mockApp = {
	vault: {
		adapter: {
			exists: vi.fn(),
			read: vi.fn(),
			write: vi.fn(),
			mkdir: vi.fn(),
		},
	},
} as unknown as App;

describe('StatsManager', () => {
	let statsManager: StatisticsManager;
	let mockCards: CardMetadata[];

	beforeEach(() => {
		statsManager = new StatisticsManager(mockApp);
		vi.clearAllMocks();

		mockCards = [
			{
				uuid: uuidv4(),
				file: 'test1.md',
				source: 'Test Note 1',
				status: CardStatus.ACTIVE,
				created: '2024-01-01T00:00:00.000Z',
				updated: '2024-01-01T00:00:00.000Z',
				deleted_at: null,
				srs: {
					stability: 1,
					difficulty: 3,
					state: 2, // Mature card
					last_review: '2024-01-01T00:00:00.000Z',
					next_review: '2024-01-02T00:00:00.000Z',
					reps: 5,
				},
			},
			{
				uuid: uuidv4(),
				file: 'test2.md',
				source: 'Test Note 2',
				status: CardStatus.ACTIVE,
				created: '2024-01-01T00:00:00.000Z',
				updated: '2024-01-01T00:00:00.000Z',
				deleted_at: null,
				srs: {
					stability: 0,
					difficulty: 7,
					state: 1, // Learning card
					last_review: '2024-01-01T00:00:00.000Z',
					next_review: '2024-01-02T00:00:00.000Z',
					reps: 2,
				},
			},
		];
	});

	it('should create empty stats when file does not exist', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await statsManager.load();

		expect(mockAdapter.exists).toHaveBeenCalledWith('knowledge-accelerator/stats.json');
		expect(mockAdapter.mkdir).toHaveBeenCalled();
		expect(mockAdapter.write).toHaveBeenCalled();
	});

	it('should load existing stats', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		const mockStats = {
			version: 1,
			summary: {
				retention_rate: 0.5,
				difficulty_dist: { 3: 1, 7: 1 },
				total_learned: 2,
				due_today: 0,
			},
			last_updated: '2024-01-01T00:00:00.000Z',
		};

		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.read.mockResolvedValue(JSON.stringify(mockStats));

		await statsManager.load();

		const summary = statsManager.statistics.summary;
		expect(summary.retention_rate).toBe(0.5);
		expect(summary.total_learned).toBe(2);
	});

	it('should save stats to disk', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await statsManager.load();
		await statsManager.save();

		expect(mockAdapter.write).toHaveBeenCalledWith(
			'knowledge-accelerator/stats.json',
			expect.stringContaining('"summary"'),
		);
	});

	it('should record review', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await statsManager.load();
		statsManager.recordReview('card-1', 4);

		const summary = statsManager.statistics.summary;
		expect(summary).toBeDefined();
	});

	it('should recompute all stats', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await statsManager.load();

		const index: Record<string, CardMetadata> = {
			'card-1': mockCards[0],
			'card-2': mockCards[1],
		};

		statsManager.recomputeAll(index);

		const summary = statsManager.statistics.summary;
		expect(summary.retention_rate).toBe(0.5); // 1 mature card out of 2 reviewed
		expect(summary.total_learned).toBe(2);
		expect(summary.difficulty_dist).toEqual({ '3': 1, '7': 1 });
	});

	it('should handle errors gracefully', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.read.mockRejectedValue(new Error('File read error'));

		await expect(statsManager.load()).rejects.toThrow('Stats loading failed');
	});
});
