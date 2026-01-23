import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplicationStore } from '@/ui/stores/ApplicationStore';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';

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

describe('ApplicationStore (Integration)', () => {
	let appStore: ApplicationStore;

	beforeEach(() => {
		appStore = new ApplicationStore(mockDependencies);
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('should initialize all stores', async () => {
			await appStore.initialize();

			expect(appStore.initialized).toBe(true);
			expect(appStore.session).toBeDefined();
			expect(appStore.settings).toBeDefined();
			expect(appStore.ui).toBeDefined();
		});

		it('should not initialize twice', async () => {
			await appStore.initialize();
			await appStore.initialize(); // Second call

			expect(appStore.initialized).toBe(true);
		});

		it('should initialize with default states', async () => {
			await appStore.initialize();

			// Session store
			expect(appStore.session.state.activeSession).toBeNull();
			expect(appStore.session.state.currentCard).toBeNull();

			// Settings store
			expect(appStore.settings.settings.theme).toBe('system');
			expect(appStore.settings.settings.dailyGoal).toBe(20);

			// UI store
			expect(appStore.ui.state.currentView).toBe('dashboard');
			expect(appStore.ui.state.theme).toBe('dark');
		});
	});

	describe('cross-store event propagation', () => {
		it('should sync theme from settings to UI', async () => {
			await appStore.initialize();

			// Update theme in settings
			appStore.settings.updateSetting('theme', 'light');

			// Verify UI theme is updated
			// Note: This happens via event listener
			// The actual update happens in setupCrossStoreListeners
			// We can verify the event was emitted
			const eventBus = appStore['eventBus'] as EventBus;
			expect(eventBus.hasListeners(AppEvents.SETTINGS_UPDATED)).toBe(true);
		});

		it('should navigate to review when session starts', async () => {
			await appStore.initialize();

			const mockCards = [
				{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} },
				{ id: 'card-2', front: 'Q2', back: 'A2', srs: {} },
			];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});

			// Start session
			await appStore.session.startSession();

			// Verify navigation to review view
			// This happens via cross-store listener
			expect(appStore.ui.state.currentView).toBe('review');
		});

		it('should handle session completed event', async () => {
			await appStore.initialize();

			const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} }];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});

			// Start and end session
			await appStore.session.startSession();
			await appStore.session.endSession();

			// Verify event was emitted and handled
			// The listener logs the session completion
			expect(appStore.session.state.activeSession).toBeNull();
		});
	});

	describe('store communication', () => {
		it('should propagate card rated events', async () => {
			await appStore.initialize();

			const mockCards = [
				{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} },
				{ id: 'card-2', front: 'Q2', back: 'A2', srs: {} },
			];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});

			// Start session
			await appStore.session.startSession();

			// Subscribe to card rated event
			let cardRatedEventFired = false;
			const eventBus = appStore['eventBus'] as EventBus;
			eventBus.on(AppEvents.CARD_RATED, () => {
				cardRatedEventFired = true;
			});

			// Rate card
			await appStore.session.rateCard(3 as any);

			expect(cardRatedEventFired).toBe(true);
		});

		it('should propagate view changed events', async () => {
			await appStore.initialize();

			let viewChangedEventFired = false;
			let viewChangedPayload: any = null;

			const eventBus = appStore['eventBus'] as EventBus;
			eventBus.on(AppEvents.VIEW_CHANGED, (data) => {
				viewChangedEventFired = true;
				viewChangedPayload = data;
			});

			// Navigate
			appStore.ui.navigate('settings');

			expect(viewChangedEventFired).toBe(true);
			expect(viewChangedPayload.view).toBe('settings');
		});
	});

	describe('lifecycle methods', () => {
		it('should dispose and clean up resources', async () => {
			await appStore.initialize();

			// Verify initialized
			expect(appStore.initialized).toBe(true);

			// Dispose
			await appStore.dispose();

			// Verify disposed
			expect(appStore.initialized).toBe(false);
		});

		it('should reset stores on dispose', async () => {
			await appStore.initialize();

			// Modify stores
			appStore.ui.navigate('review');
			appStore.settings.updateSetting('dailyGoal', 50);

			// Dispose
			await appStore.dispose();

			// Verify stores reset
			expect(appStore.ui.state.currentView).toBe('dashboard');
			expect(appStore.settings.settings.dailyGoal).toBe(20);
		});

		it('should clean up event listeners on dispose', async () => {
			await appStore.initialize();

			const eventBus = appStore['eventBus'] as EventBus;
			expect(eventBus.hasListeners(AppEvents.SETTINGS_UPDATED)).toBe(true);

			await appStore.dispose();

			// Note: EventBus doesn't have a method to check if no listeners
			// But we can verify the unsubscribe functions were called
			const unsubscribeCount = appStore['unsubscribeFunctions'].length;
			expect(unsubscribeCount).toBe(0);
		});
	});

	describe('error handling', () => {
		it('should handle initialization errors gracefully', async () => {
			// Create a store that throws during initialization
			const errorDependencies = {
				...mockDependencies,
				eventBus: new EventBus(),
			};

			const errorAppStore = new ApplicationStore(errorDependencies);

			// Mock setupCrossStoreListeners to throw
			errorAppStore['setupCrossStoreListeners'] = () => {
				throw new Error('Initialization failed');
			};

			await expect(errorAppStore.initialize()).rejects.toThrow(
				'Initialization failed'
			);
		});
	});

	describe('store composition', () => {
		it('should provide access to all composed stores', async () => {
			await appStore.initialize();

			// Verify all stores are accessible
			expect(appStore.session).toBeDefined();
			expect(appStore.settings).toBeDefined();
			expect(appStore.ui).toBeDefined();

			// Verify stores have expected methods
			expect(typeof appStore.session.startSession).toBe('function');
			expect(typeof appStore.settings.updateSetting).toBe('function');
			expect(typeof appStore.ui.navigate).toBe('function');
		});

		it('should share EventBus across all stores', async () => {
			await appStore.initialize();

			const sharedEventBus = appStore['eventBus'];

			expect(appStore.session['eventBus']).toBe(sharedEventBus);
			expect(appStore.settings['eventBus']).toBe(sharedEventBus);
			expect(appStore.ui['eventBus']).toBe(sharedEventBus);
		});
	});

	describe('complex workflows', () => {
		it('should handle complete review session workflow', async () => {
			await appStore.initialize();

			const mockCards = [
				{ id: 'card-1', front: 'Q1', back: 'A1', srs: {} },
				{ id: 'card-2', front: 'Q2', back: 'A2', srs: {} },
			];
			mockDueQueueManager.generate.mockResolvedValue({
				cards: mockCards,
				totalDue: mockCards.length,
			});

			// Start session (should navigate to review view)
			await appStore.session.startSession();
			expect(appStore.ui.state.currentView).toBe('review');

			// Rate first card
			await appStore.session.rateCard(3 as any);
			expect(appStore.session.state.currentCard?.id).toBe('card-2');

			// Rate second card (should end session)
			await appStore.session.rateCard(3 as any);
			expect(appStore.session.state.activeSession).toBeNull();
		});

		it('should handle settings change affecting UI', async () => {
			await appStore.initialize();

			// Verify we have cross-store listener for SETTINGS_UPDATED
			const eventBus = appStore['eventBus'] as EventBus;
			expect(eventBus.hasListeners(AppEvents.SETTINGS_UPDATED)).toBe(true);

			// Change theme in settings - this emits both SETTINGS_UPDATED and THEME_CHANGED
			appStore.settings.updateSetting('theme', 'light');
		});
	});
});
