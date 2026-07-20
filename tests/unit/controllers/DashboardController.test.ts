import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DashboardController } from '@/ui/controllers/DashboardController';
import { sessionStore } from '@/ui/store/session.store';
import { uiStore } from '@/ui/store/ui.store';
import { IndexKey } from '@/types/indexes';
import { EventBus } from '@/modules/events';
import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';

// Mock FlashcardReviewQueue to avoid EventBus side effects
vi.mock('@/modules/review-queues/FlashcardReviewQueue', () => ({
	FlashcardReviewQueue: vi.fn().mockImplementation(() => ({
		recalc: vi.fn(),
		dispose: vi.fn(),
	})),
}));

describe('DashboardController integration', () => {
	beforeEach(() => {
		sessionStore.reset();
		uiStore.isLoading = false;
		uiStore.currentView = 'dashboard';
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should accept deckFilter parameter in startReview', () => {
		const controller = new DashboardController();
		expect(typeof controller.startReview).toBe('function');
	});

	it('should pass deckFilter to session store and queue constructor', async () => {
		const controller = new DashboardController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		await controller.startReview(IndexKey.flashcard, 'Maths');

		expect(sessionStore.state.deck_filter).toBe('Maths');
		expect(sessionStore.state.review_type).toBe('flashcard');
		expect(sessionStore.state.session_id).not.toBeNull();
		expect(FlashcardReviewQueue).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));
		expect(publishSpy).toHaveBeenCalled();

		publishSpy.mockRestore();
	});

	it('should pass undefined deckFilter as null to session and undefined to queue', async () => {
		const controller = new DashboardController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		await controller.startReview(IndexKey.flashcard);

		expect(sessionStore.state.deck_filter).toBeNull();
		expect(sessionStore.state.review_type).toBe('flashcard');
		expect(FlashcardReviewQueue).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));

		publishSpy.mockRestore();
	});

	it('should pass Uncategorized deckFilter to session and queue', async () => {
		const controller = new DashboardController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		await controller.startReview(IndexKey.flashcard, 'Uncategorized');

		expect(sessionStore.state.deck_filter).toBe('Uncategorized');
		expect(FlashcardReviewQueue).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));

		publishSpy.mockRestore();
	});
});

describe('SessionStore deck_filter', () => {
	beforeEach(() => {
		sessionStore.reset();
	});

	it('should have null deck_filter by default', () => {
		expect(sessionStore.state.deck_filter).toBeNull();
	});

	it('should record deck_filter when starting session', () => {
		sessionStore.startSession('flashcard', 'Maths');
		expect(sessionStore.state.deck_filter).toBe('Maths');
	});

	it('should store null deck_filter when no filter provided', () => {
		sessionStore.startSession('flashcard');
		expect(sessionStore.state.deck_filter).toBeNull();
	});

	it('should clear deck_filter on reset', () => {
		sessionStore.startSession('flashcard', 'Maths');
		expect(sessionStore.state.deck_filter).toBe('Maths');
		sessionStore.reset();
		expect(sessionStore.state.deck_filter).toBeNull();
	});

	it('should preserve deck_filter across multiple sessions', () => {
		sessionStore.startSession('flashcard', 'Maths');
		const firstSessionId = sessionStore.state.session_id;
		const firstDeckFilter = sessionStore.state.deck_filter;

		sessionStore.startSession('flashcard', 'CS');
		expect(sessionStore.state.session_id).not.toBe(firstSessionId);
		expect(sessionStore.state.deck_filter).toBe('CS');
		expect(firstDeckFilter).toBe('Maths');
	});
});
