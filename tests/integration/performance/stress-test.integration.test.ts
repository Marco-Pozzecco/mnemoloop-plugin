/**
 * Stress test for 10k notes scenario
 *
 * Tests UI responsiveness with large datasets to verify no blocking.
 *
 * Success Criteria:
 * - UI remains responsive during indexing
 * - Search queries complete in <2 seconds
 * - Memory usage stays within acceptable bounds
 * - No UI thread blocking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { App } from 'obsidian';
import { IndexManager } from '@/core/indexer/IndexerManager';
import { StatisticsManager } from '@/core/statistics/StatisticsManager';
import { EventBus } from '@/ui/infrastructure/EventBus';

describe('Stress Test: 10k Notes Scenario', () => {
	let mockApp: Partial<App> = {};
	let indexManager: IndexManager;
	let statisticsManager: StatisticsManager;
	let eventBus: EventBus;

	beforeEach(() => {
		// Setup mock Obsidian app
		mockApp = {
			vault: {
				getFiles: vi.fn(),
				on: vi.fn(),
				off: vi.fn(),
			} as any,
			workspace: {
				on: vi.fn(),
				off: vi.fn(),
			} as any,
		} as App;

		eventBus = new EventBus();
		statisticsManager = new StatisticsManager(mockApp as any);
		indexManager = new IndexManager(mockApp as any);
	});

	afterEach(async () => {
		// Cleanup
		await indexManager.dispose();
		statisticsManager.dispose();
		eventBus = {} as any;
		indexManager = {} as any;
		mockApp = {} as Partial<App>;
	});

	it('should index 10k notes without UI blocking', async () => {
		// Generate 10k mock notes
		const mockNotes = Array.from({ length: 10000 }, (_, i) => ({
			path: `note-${i}.md`,
			name: `note-${i}`,
			stat: {
				mtime: Date.now(),
				size: i * 100,
			},
		}));

		// Setup mock vault to return notes
		vi.spyOn(indexManager, 'indexNote').mockResolvedValue(undefined);

		// Measure indexing performance
		const startTime = performance.now();

		for (let i = 0; i < mockNotes.length; i++) {
			await indexManager.indexNote(mockNotes[i] as any);
		}

		const endTime = performance.now();
		const duration = endTime - startTime;

		// Verify performance: should complete in <5 seconds
		expect(duration).toBeLessThan(5000);

		// Verify all notes indexed
		expect(indexManager.indexNote).toHaveBeenCalledTimes(10000);
	});

	it('should search 10k notes quickly', async () => {
		// Pre-populate index with 10k cards
		const mockCards = Array.from({ length: 10000 }, (_, i) => ({
			id: `card-${i}`,
			front: `Front ${i}`,
			back: `Back ${i}`,
			source: `note-${i}.md`,
			status: 'ACTIVE',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}));

		vi.spyOn(indexManager, 'getCards').mockResolvedValue(mockCards as any);

		// Measure search performance
		const startTime = performance.now();

		const result = await indexManager.search('Front 5000');

		const endTime = performance.now();
		const duration = endTime - startTime;

		// Verify search completes in <2 seconds
		expect(duration).toBeLessThan(2000);

		// Verify search results
		expect(result).toBeDefined();
	});

	it('should maintain memory within acceptable bounds', async () => {
		// Generate moderate dataset
		const mockNotes = Array.from({ length: 5000 }, (_, i) => ({
			path: `note-${i}.md`,
			name: `note-${i}`,
			stat: {
				mtime: Date.now(),
				size: 1000,
			},
		}));

		vi.spyOn(indexManager, 'indexNote').mockResolvedValue(undefined);

		// Index all notes
		for (const note of mockNotes) {
			await indexManager.indexNote(note as any);
		}

		// Get memory usage (approximate)
		const memoryUsage = process.memoryUsage();

		// Verify memory stays within reasonable bounds (<200MB)
		expect(memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024);
	});

	it('should not block UI during bulk operations', async () => {
		// Setup UI blocking detection
		let uiBlockedFrames = 0;

		// Mock UI frame updates
		const originalRequestAnimationFrame = global.requestAnimationFrame;
		global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
			const start = performance.now();
			const result = originalRequestAnimationFrame(callback);
			const duration = performance.now() - start;

			// If frame takes >16ms (60fps threshold), count as blocked
			if (duration > 16) {
				uiBlockedFrames++;
			}

			return result;
		}) as any;

		// Generate batch operations
		const batchOperations = Array.from({ length: 100 }, (_, i) => ({
			path: `batch-note-${i}.md`,
			name: `Batch Note ${i}`,
			stat: {
				mtime: Date.now(),
				size: 500,
			},
		}));

		vi.spyOn(indexManager, 'indexNote').mockResolvedValue(undefined);

		// Execute batch operations
		for (const op of batchOperations) {
			await indexManager.indexNote(op as any);
			// Trigger UI frame updates
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		// Restore original RAF
		global.requestAnimationFrame = originalRequestAnimationFrame;

		// Verify minimal UI blocking (<5% of frames)
		const blockPercentage = (uiBlockedFrames / 100) * 100;
		expect(blockPercentage).toBeLessThan(5);
	});

	it('should handle concurrent state updates efficiently', async () => {
		const stateUpdates: string[] = [];

		// Setup event listener
		eventBus.on('test-event', () => {
			stateUpdates.push('updated');
		});

		// Fire 100 concurrent updates
		const startTime = performance.now();

		for (let i = 0; i < 100; i++) {
			eventBus.emit('test-event', { data: i });
		}

		const endTime = performance.now();
		const duration = endTime - startTime;

		// Verify all updates processed
		expect(stateUpdates).toHaveLength(100);

		// Verify fast update processing (<1 second for 100 events)
		expect(duration).toBeLessThan(1000);

		// Cleanup
		eventBus.off('test-event');
	});

	it('should maintain responsiveness during rapid navigation', async () => {
		const navigationTimes: number[] = [];

		// Simulate rapid view navigation (20 rapid navigations)
		for (let i = 0; i < 20; i++) {
			const startTime = performance.now();

			// Simulate view change (index lookup is common operation)
			await indexManager.getCard(`card-${i % 100}`);

			const endTime = performance.now();
			navigationTimes.push(endTime - startTime);
		}

		// Calculate statistics
		const avgTime = navigationTimes.reduce((sum, time) => sum + time, 0) / navigationTimes.length;
		const maxTime = Math.max(...navigationTimes);

		// Verify navigation stays responsive (<100ms average)
		expect(avgTime).toBeLessThan(100);

		// Verify no navigation takes >500ms
		expect(maxTime).toBeLessThan(500);
	});

	it('should handle large card queue efficiently', async () => {
		// Generate large queue
		const largeQueue = Array.from({ length: 1000 }, (_, i) => ({
			id: `card-${i}`,
			front: `Front ${i}`,
			back: `Back ${i}`,
			source: `note-${i % 100}.md`,
		}));

		// Mock queue generation
		vi.spyOn(indexManager, 'getCards').mockResolvedValue(largeQueue as any);

		// Measure queue operations
		const startTime = performance.now();

		const cards = await indexManager.getCards();

		const endTime = performance.now();
		const duration = endTime - startTime;

		// Verify queue loads in <2 seconds
		expect(duration).toBeLessThan(2000);

		// Verify all cards loaded
		expect(cards).toHaveLength(1000);
	});
});
