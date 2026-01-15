import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndexManager } from '@/core/indexer/managers/IndexManager';
import { StatsManager } from '@/core/indexer/managers/StatsManager';
import { CardMetadata } from '@/core/indexer/schema/indexSchema';
import { App } from 'obsidian';
import { CardStatus } from '@/core';
import { v4 as uuidv4 } from 'uuid';
import { State } from 'ts-fsrs';

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

describe('Performance Tests', () => {
	let indexManager: IndexManager;
	let statsManager: StatsManager;

	beforeEach(() => {
		indexManager = new IndexManager(mockApp);
		statsManager = new StatsManager(mockApp);
		vi.clearAllMocks();
	});

	it('should load 10,000 cards in under 2 seconds', async () => {
		const mockAdapter = mockApp.vault.adapter as any;

		// Create mock data for 10,000 cards
		const mockCards: Record<string, CardMetadata> = {};
		for (let i = 0; i < 10000; i++) {
			mockCards[`card-${i}`] = {
				uuid: uuidv4(),
				file: `flashcards/card-${i}.md`,
				source: `Note ${i}`,
				status: CardStatus.ACTIVE,
				created: '2024-01-01T00:00:00.000Z',
				updated: '2024-01-01T00:00:00.000Z',
				deleted_at: null,
				srs: {
					stability: Math.random() * 10,
					difficulty: Math.random() * 10,
					state: Math.floor(Math.random() * 4),
					last_review: Math.random() > 0.5 ? '2024-01-01T00:00:00.000Z' : null,
					next_review: '2024-01-02T00:00:00.000Z',
					reps: Math.floor(Math.random() * 10),
				},
			};
		}

		const mockIndex = {
			version: 1,
			cards: mockCards,
		};

		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.read.mockResolvedValue(JSON.stringify(mockIndex));

		// Measure load time
		const startTime = performance.now();
		await indexManager.load();
		const endTime = performance.now();

		const loadTime = endTime - startTime;
		expect(loadTime).toBeLessThan(2000); // Less than 2 seconds

		// Verify cards are loaded
		expect(indexManager.getCard('card-0')).toBeDefined();
		expect(indexManager.getCard('card-9999')).toBeDefined();
	});

	it('should simulate 100 reviews and maintain stats consistency', async () => {
		const mockAdapter = mockApp.vault.adapter as any;
		mockAdapter.exists.mockResolvedValue(false);
		mockAdapter.mkdir.mockResolvedValue(undefined);
		mockAdapter.write.mockResolvedValue(undefined);

		// Load both managers
		await indexManager.load();
		await statsManager.load();
		vi.clearAllMocks();

		// Create initial cards
		const mockCards: Record<string, CardMetadata> = {};
		for (let i = 0; i < 100; i++) {
			const card: CardMetadata = {
				uuid: uuidv4(),
				file: `flashcards/card-${i}.md`,
				source: `Note ${i}`,
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
			mockCards[`card-${i}`] = card;
			indexManager.upsertCard(`card-${i}`, card);
		}

		// Simulate 100 reviews
		for (let i = 0; i < 100; i++) {
			const cardId = `card-${i}`;
			const rating = Math.floor(Math.random() * 4) + 1; // 1-4
			const success = rating >= 3; // Ratings 3+ are successful

			// Record review
			statsManager.recordReview(cardId, rating, success);

			// Update card SRS data (simplified)
			const card = indexManager.getCard(cardId);
			if (card) {
				const updatedCard = {
					...card,
					srs: {
						...card.srs,
						reps: card.srs.reps + 1,
						last_review: new Date().toISOString(),
						state: success ? State.Review : State.Relearning,
					},
					updated: new Date().toISOString(),
				};
				indexManager.upsertCard(cardId, updatedCard);
				mockCards[cardId] = updatedCard;
			}
		}

		// Recompute stats
		statsManager.recomputeAll(mockCards);

		// Verify consistency
		const summary = statsManager.getSummary();
		expect(summary.total_learned).toBeGreaterThan(0);
		expect(summary.retention_rate).toBeGreaterThanOrEqual(0);
		expect(summary.retention_rate).toBeLessThanOrEqual(1);

		// Save and reload to verify persistence
		await statsManager.save();
		await indexManager.save();

		expect(mockAdapter.write).toHaveBeenCalledTimes(2); // stats.json and index.json
	});

	it('should handle memory usage within limits', async () => {
		const mockAdapter = mockApp.vault.adapter as any;

		// Create mock data for 50,000 cards (stress test)
		const mockCards: Record<string, CardMetadata> = {};
		for (let i = 0; i < 50000; i++) {
			mockCards[`card-${i}`] = {
				uuid: uuidv4(),
				file: `flashcards/card-${i}.md`,
				source: `Note ${i}`,
				status: CardStatus.ACTIVE,
				created: '2024-01-01T00:00:00.000Z',
				updated: '2024-01-01T00:00:00.000Z',
				deleted_at: null,
				srs: {
					stability: Math.random() * 10,
					difficulty: Math.random() * 10,
					state: Math.floor(Math.random() * 4),
					last_review: Math.random() > 0.5 ? '2024-01-01T00:00:00.000Z' : null,
					next_review: '2024-01-02T00:00:00.000Z',
					reps: Math.floor(Math.random() * 10),
				},
			};
		}

		const mockIndex = {
			version: 1,
			cards: mockCards,
		};

		mockAdapter.exists.mockResolvedValue(true);
		mockAdapter.read.mockResolvedValue(JSON.stringify(mockIndex));

		// Force garbage collection to get accurate memory measurement
		if (global.gc) {
			global.gc();
		}

		const initialMemory = process.memoryUsage().heapUsed;

		await indexManager.load();

		// Force garbage collection again
		if (global.gc) {
			global.gc();
		}

		const finalMemory = process.memoryUsage().heapUsed;
		const memoryIncrease = finalMemory - initialMemory;

		// Convert to MB
		const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

		// Should be under 80MB overhead
		expect(memoryIncreaseMB).toBeLessThan(80);

		console.log(`Memory increase for 50,000 cards: ${memoryIncreaseMB.toFixed(2)} MB`);
	});
});
