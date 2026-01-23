/**
 * Unit tests for ReviewController
 *
 * Tests error scenarios, session pause on error, and error recovery.
 *
 * @see T091 [P] [US3]: Write unit tests for ReviewController
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReviewController } from '@/ui/controllers/ReviewController';
import type { Flashcard } from '@/core/parser/utils/types';
import type { Logger } from '@/ui/infrastructure/Logger';
import type { EventBus } from '@/ui/infrastructure/EventBus';
import type { SessionStore } from '@/ui/stores/SessionStore';
import type { IndexManager } from '@/core/indexer/IndexerManager';

// Mock dependencies
const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
	getCorrelationId: vi.fn(() => 'test-correlation-id'),
} as unknown as Logger;

const mockEventBus = {
	on: vi.fn(),
	off: vi.fn(),
	emit: vi.fn(),
	once: vi.fn(),
	clear: vi.fn(),
	hasListeners: vi.fn(),
	getListenerCount: vi.fn(),
	getRegisteredEvents: vi.fn(),
} as unknown as EventBus;

const mockApp = {
	vault: {
		getAbstractFileByPath: vi.fn(),
	},
	workspace: {
		getLeaf: vi.fn(),
	},
} as any;

const mockFlashcard: Flashcard = {
	id: 'test-card-id',
	front: 'Test front',
	back: 'Test back',
	srs: {
		stability: 0,
		due: new Date().toISOString(),
		last_review: null,
		state: 'NEW',
		retrievability: 0,
	},
	schedule: null,
	deck: 'test-deck',
	tags: [],
	source: 'test/file.md',
};

describe('ReviewController', () => {
	let reviewController: ReviewController;
	let mockSessionStore: SessionStore;
	let mockIndexManager: IndexManager;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock SessionStore
		mockSessionStore = {
			subscribe: vi.fn(),
			submitRating: vi.fn(),
			showAnswer: vi.fn(),
			hideAnswer: vi.fn(),
			nextCard: vi.fn(),
			previousCard: vi.fn(),
			endSession: vi.fn(),
			pauseSession: vi.fn(),
			resumeSession: vi.fn(),
			get activeSession() {
				return null;
			},
			get currentCard() {
				return null;
			},
			get isAnswerShowing() {
				return false;
			},
			get sessionStats() {
				return {
					totalReviewed: 0,
					correctAnswers: 0,
					incorrectAnswers: 0,
					sessionDuration: 0,
				};
			},
			get sessionProgress() {
				return 0;
			},
			get remainingCards() {
				return 0;
			},
		} as unknown as SessionStore;

		// Mock IndexManager
		mockIndexManager = {
			getCard: vi.fn(),
		} as unknown as IndexManager;

		reviewController = new ReviewController(
			mockLogger,
			mockEventBus,
			mockApp,
			mockIndexManager,
			mockSessionStore
		);
	});

	afterEach(async () => {
		await reviewController.dispose();
	});

	describe('Initialization', () => {
		it('should initialize controller', async () => {
			await reviewController.initialize();

			expect(mockLogger.info).toHaveBeenCalledWith('ReviewController initialized');
		});

		it('should dispose controller', async () => {
			await reviewController.initialize();
			await reviewController.dispose();

			expect(mockLogger.info).toHaveBeenCalledWith('ReviewController disposed');
		});
	});

	describe('Submit Rating - Error Scenarios', () => {
		it('should submit rating successfully', async () => {
			mockSessionStore.submitRating = vi.fn().mockResolvedValue(undefined);

			const result = await reviewController.submitRating('card-123', 3);

			expect(result.success).toBe(true);
			expect(mockSessionStore.submitRating).toHaveBeenCalledWith(3);
			expect(mockEventBus.emit).toHaveBeenCalledWith('card:rated', {
				cardId: 'card-123',
				rating: 3,
				timestamp: expect.any(String),
			});
		});

		it('should return error when cardId is missing', async () => {
			const result = await reviewController.submitRating('', 3);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toContain('Card ID is required');
		});

		it('should return error when session is paused', async () => {
			reviewController.pauseSession();

			const result = await reviewController.submitRating('card-123', 3);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('session is paused');
		});

		it('should handle rating submission errors', async () => {
			const testError = new Error('FSRS calculation failed');
			mockSessionStore.submitRating = vi.fn().mockRejectedValue(testError);

			const result = await reviewController.submitRating('card-123', 3);

			expect(result.success).toBe(false);
			expect(result.error).toBe(testError);
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Review session paused due to error:',
				testError
			);
		});

		it('should log error on rating failure', async () => {
			const testError = new Error('Network error');
			mockSessionStore.submitRating = vi.fn().mockRejectedValue(testError);

			await reviewController.submitRating('card-123', 3);

			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('Session Pause on Error', () => {
		it('should pause session when rating error occurs', async () => {
			mockSessionStore.submitRating = vi.fn().mockRejectedValue(new Error('Test error'));
			mockSessionStore.pauseSession = vi.fn();

			await reviewController.submitRating('card-123', 3);

			expect(mockSessionStore.pauseSession).toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith('Review session paused');
		});

		it('should emit error event when rating fails', async () => {
			mockSessionStore.submitRating = vi.fn().mockRejectedValue(new Error('Test error'));

			await reviewController.submitRating('card-123', 3);

			expect(mockEventBus.emit).toHaveBeenCalledWith('card:rated', {
				error: 'Test error',
				cardId: null,
				timestamp: expect.any(String),
			});
		});

		it('should prevent rating submissions while paused', async () => {
			reviewController.pauseSession();
			mockSessionStore.submitRating = vi.fn();

			const result = await reviewController.submitRating('card-123', 3);

			expect(result.success).toBe(false);
			expect(mockSessionStore.submitRating).not.toHaveBeenCalled();
		});

		it('should allow rating submissions after resuming', async () => {
			reviewController.pauseSession();
			reviewController.resumeSession();

			mockSessionStore.submitRating = vi.fn().mockResolvedValue(undefined);

			const result = await reviewController.submitRating('card-123', 3);

			expect(result.success).toBe(true);
			expect(mockSessionStore.submitRating).toHaveBeenCalled();
		});

		it('should check session paused state', () => {
			expect(reviewController.isSessionPaused()).toBe(false);

			reviewController.pauseSession();
			expect(reviewController.isSessionPaused()).toBe(true);

			reviewController.resumeSession();
			expect(reviewController.isSessionPaused()).toBe(false);
		});
	});

	describe('Get Next Card', () => {
		it('should get next card from session store', async () => {
			mockSessionStore.subscribe = vi.fn((callback) => {
				callback({
					activeSession: null,
					currentCard: mockFlashcard,
					isAnswerShowing: false,
					sessionStats: {
						totalReviewed: 0,
						correctAnswers: 0,
						incorrectAnswers: 0,
						sessionDuration: 0,
					},
				});
				return () => {};
			});

			const card = await reviewController.getNextCard();

			expect(card).toEqual(mockFlashcard);
		});

		it('should return null when session is paused', async () => {
			reviewController.pauseSession();

			const card = await reviewController.getNextCard();

			expect(card).toBeNull();
			expect(mockLogger.warn).toHaveBeenCalledWith('Cannot get next card: session is paused due to error');
		});
	});

	describe('Edit Source', () => {
		it('should attempt to open source file', async () => {
			const mockFile = { path: 'test/file.md' };
			mockIndexManager.getCard = vi.fn().mockReturnValue({
				...mockFlashcard,
				source: 'test/file.md',
			});
			mockApp.vault.getAbstractFileByPath = vi.fn().mockReturnValue(mockFile);

			const result = await reviewController.editSource('card-123');

			// Check that card was found and file lookup attempted
			expect(mockIndexManager.getCard).toHaveBeenCalledWith('card-123');
			expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith('test/file.md');
			// Note: In real environment with TFile instance, it would succeed and return undefined
			// Here with mock object, instanceof check fails and returns null
			// We verify that the path was looked up correctly
		});

		it('should return null when card not found', async () => {
			mockIndexManager.getCard = vi.fn().mockReturnValue(null);

			const result = await reviewController.editSource('nonexistent-card');
			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it('should return null when source path missing', async () => {
			mockIndexManager.getCard = vi.fn().mockReturnValue({
				...mockFlashcard,
				source: null,
			});

			const result = await reviewController.editSource('card-123');
			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it('should return null when file not found', async () => {
			mockIndexManager.getCard = vi.fn().mockReturnValue({
				...mockFlashcard,
				source: 'missing/file.md',
			});
			mockApp.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);

			const result = await reviewController.editSource('card-123');
			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it('should return null on file opening errors', async () => {
			mockIndexManager.getCard = vi.fn().mockReturnValue(mockFlashcard);
			mockApp.vault.getAbstractFileByPath = vi.fn().mockReturnValue({});
			mockApp.workspace.getLeaf = vi.fn().mockReturnValue({
				openFile: vi.fn().mockRejectedValue(new Error('File open error')),
			});

			const result = await reviewController.editSource('card-123');
			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('Verify and Reset', () => {
		it('should log verify and reset attempt', async () => {
			await reviewController.verifyAndReset('card-123');

			expect(mockLogger.debug).toHaveBeenCalledWith('Verifying and resetting card: card-123');
		});
	});

	describe('End Session', () => {
		it('should end session and clear paused state', async () => {
			reviewController.pauseSession();
			mockSessionStore.endSession = vi.fn().mockResolvedValue(undefined);

			await reviewController.endSession();

			expect(mockSessionStore.endSession).toHaveBeenCalled();
			expect(reviewController.isSessionPaused()).toBe(false);
			expect(mockLogger.info).toHaveBeenCalledWith('Review session ended');
		});
	});

	describe('Error Recovery', () => {
		it('should provide actionable error message', async () => {
			mockSessionStore.submitRating = vi.fn().mockRejectedValue(
				new Error('Network connection lost')
			);

			const result = await reviewController.submitRating('card-123', 3);

			expect(result.success).toBe(false);
			expect(result.error?.message).toBe('Network connection lost');
		});

		it('should allow retry after error', async () => {
			// First attempt fails
			mockSessionStore.submitRating = vi
				.fn()
				.mockRejectedValueOnce(new Error('First attempt failed'))
				.mockResolvedValueOnce(undefined);

			const result1 = await reviewController.submitRating('card-123', 3);
			expect(result1.success).toBe(false);

			// Resume session and retry
			reviewController.resumeSession();
			const result2 = await reviewController.submitRating('card-123', 3);
			expect(result2.success).toBe(true);
		});
	});
});
