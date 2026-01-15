import { CardStatus } from '@/core';
import { IndexManager } from '@/core/indexer/managers/IndexManager';
import { CardMetadata } from '@/core/indexer/schema/indexSchema';
import { App } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Obsidian App
const mockApp = {
	vault: {
		adapter: {
			exists: vi.fn(),
			read: vi.fn(),
			write: vi.fn(),
			mkdir: vi.fn(),
			list: vi.fn(),
		},
	},
} as unknown as App;

describe('IndexManager', () => {
	let indexManager: IndexManager;
	let mockCard: CardMetadata;

	beforeEach(() => {
		indexManager = new IndexManager(mockApp);
		vi.clearAllMocks();

		mockCard = {
			uuid: 'card-1',
			file: 'flashcards/test.md',
			source: 'Test Note',
			status: CardStatus.ACTIVE,
			created: '2024-01-01T00:00:00.000Z',
			updated: '2024-01-01T00:00:00.000Z',
			deleted_at: null,
			srs: {
				stability: 0,
				difficulty: 5,
				state: 0,
				last_review: null,
				next_review: '2024-01-02T00:00:00.000Z',
				reps: 0,
			},
		};
	});

	it('should create empty index when file does not exist', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await indexManager.load();

		expect(mockAdapter.exists).toHaveBeenCalledWith('knowledge-accelerator/index.json');
		expect(mockAdapter.mkdir).toHaveBeenCalled();
		expect(mockAdapter.write).toHaveBeenCalled();
	});

	it('should load existing index', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		const mockIndex = {
			version: 1,
			cards: { 'card-1': mockCard },
		};

		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.read.mockResolvedValue(JSON.stringify(mockIndex));

		await indexManager.load();

		const loadedCard = indexManager.getCard('card-1');
		expect(loadedCard).toEqual(mockCard);
	});

	it('should save index to disk', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await indexManager.load();
		indexManager.upsertCard('card-1', mockCard);
		await indexManager.save();

		expect(mockAdapter.write).toHaveBeenCalledWith(
			'knowledge-accelerator/index.json',
			expect.stringContaining('"cards"'),
		);
	});

	it('should get and update cards', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await indexManager.load();
		indexManager.upsertCard('card-1', mockCard);

		const retrievedCard = indexManager.getCard('card-1');
		expect(retrievedCard).toBeDefined();
		expect(retrievedCard?.file).toBe(mockCard.file);
	});

	it('should mark cards as deleted', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		await indexManager.load();
		indexManager.upsertCard('card-1', mockCard);
		indexManager.deleteCard('card-1');

		const deletedCard = indexManager.getCard('card-1');
		expect(deletedCard?.status).toBe('DELETED');
		expect(deletedCard?.deleted_at).toBeTruthy();
	});

	it('should rebuild from vault', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.list.mockResolvedValue({
			files: ['flashcards/test1.md', 'flashcards/test2.md'],
			folders: [],
		});
		mockAdapter.read.mockImplementation((file: string) => {
			if (file === 'flashcards/test1.md') {
				return `---
source: "Source Note 1"
srs: {"stability": 0, "difficulty": 5, "state": 0, "last_review": null, "next_review": "2024-01-02T00:00:00.000Z", "reps": 0}
---
# Test Card 1`;
			}
			if (file === 'flashcards/test2.md') {
				return `---
source: "Source Note 2"
srs: {"stability": 1, "difficulty": 6, "state": 1, "last_review": "2024-01-01T00:00:00.000Z", "next_review": "2024-01-03T00:00:00.000Z", "reps": 1}
---
# Test Card 2`;
			}
			return '';
		});
		mockAdapter.write.mockResolvedValue(undefined);

		await indexManager.rebuildFromVault();

		expect(indexManager.getCard('flashcards-test1-md')).toBeDefined();
		expect(indexManager.getCard('flashcards-test2-md')).toBeDefined();
	});

	it('should handle errors gracefully', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.read.mockRejectedValue(new Error('File read error'));

		await expect(indexManager.load()).rejects.toThrow('Index loading failed');
	});
});
