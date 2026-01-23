import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionStore } from '@/ui/stores/session/SessionStore';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import { FSRSRating } from '@/ui/stores/session/types';
import type { SessionState } from '@/ui/stores/session/types';

// Mock dependencies
const mockIndexManager = {};
const mockStatsManager = {};
const mockDueQueueManager = {
	generate: vi.fn(),
};

const mockDependencies = {
	eventBus: new EventBus(),
	indexManager: mockIndexManager,
	statsManager: mockStatsManager,
	dueQueueManager: mockDueQueueManager,
};

describe('SessionStore', () => {
	let sessionStore: SessionStore;

	beforeEach(() => {
		sessionStore = new SessionStore(mockDependencies);
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('should initialize with default state', () => {
			const state = sessionStore.state;
			expect(state.activeSession).toBeNull();
			expect(state.currentCard).toBeNull();
			expect(state.queue).toEqual([]);
			expect(state.isAnswerShowing).toBe(false);
			expect(state.progress).toEqual({
				currentIndex: 0,
				total: 0,
				percentage: 0,
			});
		});

		it('should provide subscribe method', () => {
			expect(typeof sessionStore.subscribe).toBe('function');
		});
	});

	describe('startSession', () => {
		it('should start a new session with cards', async () => {
			const mockCards = [
				{
					id: 'card-1',
					front: 'Question 1',
					back: 'Answer 1',
					srs: {},
				},
				{
					id: 'card-2',
					front: 'Question 2',
					back: 'Answer 2',
					srs: {},
				},
			];

			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});

			const emitSpy = vi.spyOn(sessionStore['eventBus'], 'emit');

			await sessionStore.startSession();

			const state = sessionStore.state;
			expect(state.activeSession).not.toBeNull();
			expect(state.activeSession?.sessionId).toBeDefined();
			expect(state.currentCard).toEqual(mockCards[0]);
			expect(state.queue).toEqual(mockCards);
			expect(state.isAnswerShowing).toBe(false);
			expect(state.progress.total).toBe(mockCards.length);
			expect(state.progress.currentIndex).toBe(0);

			// Verify event was emitted
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SESSION_STARTED, {
				sessionId: state.activeSession?.sessionId,
				queueSize: mockCards.length,
				startTime: expect.any(Number),
			});
		});

		it('should end existing session before starting new one', async () => {
			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});

			await sessionStore.startSession();
			const firstSessionId = sessionStore.state.activeSession?.sessionId;

			await sessionStore.startSession();
			const secondSessionId = sessionStore.state.activeSession?.sessionId;

			expect(firstSessionId).not.toBe(secondSessionId);
		});

		it('should handle no cards due', async () => {
			mockDueQueueManager.generate.mockResolvedValue({
				cards: [],
				totalDue: 0,
			});

			await sessionStore.startSession();

			const state = sessionStore.state;
			expect(state.activeSession).toBeNull();
			expect(state.currentCard).toBeNull();
		});
	});

	describe('rateCard', () => {
		beforeEach(async () => {
			const mockCards = [
				{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} },
				{ id: 'card-2', front: 'Q2', back: 'A2', srs: {} },
			];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();
		});

		it('should rate a card and emit event', async () => {
			const emitSpy = vi.spyOn(sessionStore['eventBus'], 'emit');

			await sessionStore.rateCard(FSRSRating.Good);

			expect(emitSpy).toHaveBeenCalledWith(AppEvents.CARD_RATED, {
				cardId: 'card-1',
				rating: FSRSRating.Good,
			});
		});

		it('should throw error if no active session', async () => {
			await sessionStore.endSession();

			await expect(sessionStore.rateCard(FSRSRating.Good)).rejects.toThrow(
				'No active session or current card'
			);
		});
	});

	describe('nextCard', () => {
		beforeEach(async () => {
			const mockCards = [
				{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} },
				{ id: 'card-2', front: 'Q2', back: 'A2', srs: {} },
			];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();
		});

		it('should navigate to next card', async () => {
			await sessionStore.nextCard();

			const state = sessionStore.state;
			expect(state.currentCard?.id).toBe('card-2');
			expect(state.progress.currentIndex).toBe(1);
			expect(state.isAnswerShowing).toBe(false);
		});

		it('should end session when reaching end of queue', async () => {
			const emitSpy = vi.spyOn(sessionStore['eventBus'], 'emit');

			await sessionStore.nextCard(); // Move to card 2
			await sessionStore.nextCard(); // End session

			const state = sessionStore.state;
			expect(state.activeSession).toBeNull();
			expect(state.currentCard).toBeNull();

			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SESSION_COMPLETED, {
				sessionId: expect.any(String),
				cardsReviewed: 2,
				totalCards: 2,
			});
		});
	});

	describe('pauseSession', () => {
		it('should pause active session', async () => {
			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();

			const emitSpy = vi.spyOn(sessionStore['eventBus'], 'emit');

			sessionStore.pauseSession();

			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SESSION_PAUSED, {
				sessionId: sessionStore.state.activeSession?.sessionId,
			});
		});
	});

	describe('resumeSession', () => {
		it('should resume paused session', async () => {
			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();
			sessionStore.pauseSession();

			const emitSpy = vi.spyOn(sessionStore['eventBus'], 'emit');

			sessionStore.resumeSession();

			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SESSION_RESUMED, {
				sessionId: sessionStore.state.activeSession?.sessionId,
			});
		});
	});

	describe('endSession', () => {
		it('should end active session and emit event', async () => {
			const mockCards = [
				{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} },
				{ id: 'card-2', front: 'Q2', back: 'A2', srs: {} },
			];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();

			const emitSpy = vi.spyOn(sessionStore['eventBus'], 'emit');

			await sessionStore.endSession();

			const state = sessionStore.state;
			expect(state.activeSession).toBeNull();
			expect(state.currentCard).toBeNull();

			// Check that SESSION_COMPLETED was emitted
			const completedCalls = emitSpy.mock.calls.filter(
				(call) => call[0] === AppEvents.SESSION_COMPLETED
			);
			expect(completedCalls.length).toBeGreaterThan(0);
			expect(completedCalls[0][1]).toMatchObject({
				sessionId: expect.any(String),
			});
		});
	});

	describe('showAnswer and hideAnswer', () => {
		it('should show answer', async () => {
			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();

			sessionStore.showAnswer();

			expect(sessionStore.state.isAnswerShowing).toBe(true);
		});

		it('should hide answer', async () => {
			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();
			sessionStore.showAnswer();

			sessionStore.hideAnswer();

			expect(sessionStore.state.isAnswerShowing).toBe(false);
		});
	});

	describe('reset', () => {
		it('should reset store to default state', async () => {
			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});
			await sessionStore.startSession();

			sessionStore.reset();

			const state = sessionStore.state;
			expect(state.activeSession).toBeNull();
			expect(state.currentCard).toBeNull();
			expect(state.queue).toEqual([]);
			expect(state.isAnswerShowing).toBe(false);
			expect(state.progress).toEqual({
				currentIndex: 0,
				total: 0,
				percentage: 0,
			});
		});
	});
});
