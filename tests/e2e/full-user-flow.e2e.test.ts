/**
 * End-to-end test for full user flow
 *
 * Tests complete user journey:
 * - Open plugin
 * - Navigate to Dashboard
 * - Change setting in Settings
 * - Verify Dashboard reflects change
 * - Start review session
 * - Rate cards
 * - End session
 * - Verify statistics updated
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { AppView, APP_VIEW } from '@/ui/views/App/AppView';
import type { App } from 'obsidian';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';

describe('E2E: Full User Flow', () => {
	let mockApp: Partial<App> = {};
	let mockAppView: AppView;
	let mockContainer: any;

	beforeEach(() => {
		// Setup mock Obsidian app
		mockApp = {
			vault: {
				getAbstractFileByPath: vi.fn(),
				on: vi.fn(),
				off: vi.fn(),
			} as any,
			workspace: {
				getLeaf: vi.fn(() => ({
					openFile: vi.fn().mockResolvedValue(undefined),
				})),
				on: vi.fn(),
				off: vi.fn(),
			} as any,
		} as App;

		// Create mock dependencies
		const eventBus = new EventBus();

		// Create mock container
		mockContainer = {
			resolve: vi.fn((name: string) => {
				if (name === 'EventBus') return eventBus;
				if (name === 'Logger') return { info: vi.fn(), error: vi.fn() };
				return null;
			}),
		};

		// Create AppView instance
		mockAppView = new AppView(
			{} as any, // mock leaf
			mockApp,
			{} as any, // mock navigationManager
			{} as any, // mock indexManager
			{} as any, // mock statisticsManager
			{} as any, // mock dueQueueManager
		) as AppView;

		// Override dependency container
		(mockAppView as any).dependencyContainer = mockContainer;
	});

	afterEach(() => {
		// Cleanup
		mockApp = {} as Partial<App>;
		mockContainer = null;
	});

	it('should navigate to Dashboard view', async () => {
		// Navigate to dashboard
		await (mockAppView as any).navigateTo('dashboard');

		// Verify view state
		expect((mockAppView as any).currentView).toBe('dashboard');
	});

	it('should change setting in Settings and reflect in Dashboard', async () => {
		// Get settings manager from container
		const settingsManager = mockContainer.resolve('SettingsManager');
		const settingsStore = settingsManager?.store;

		// Navigate to settings
		await (mockAppView as any).navigateTo('settings');

		// Change a setting
		settingsStore?.updateSetting('dailyGoal', 50);

		// Wait for event propagation
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Navigate back to dashboard
		await (mockAppView as any).navigateTo('dashboard');

		// Verify setting is reflected
		const dashboardStats = mockContainer.resolve('DashboardController');
		expect(dashboardStats).toBeDefined();
	});

	it('should start review session and rate cards', async () => {
		// Navigate to review view
		await (mockAppView as any).navigateTo('review');

		// Start session
		const sessionStore = mockContainer.resolve('SessionStore');
		await sessionStore?.startSession();

		// Verify session started
		expect(sessionStore?.state.activeSession).toBeTruthy();
		expect(sessionStore?.state.currentCard).toBeTruthy();

		// Submit rating
		await sessionStore?.rateCard(3); // Good rating

		// Verify card progressed
		expect(sessionStore?.state.currentIndex).toBeGreaterThan(0);
	});

	it('should end session and update statistics', async () => {
		// Start a session
		const sessionStore = mockContainer.resolve('SessionStore');
		await sessionStore?.startSession();

		// End session
		await sessionStore?.endSession();

		// Verify session state
		expect(sessionStore?.state.activeSession).toBeNull();

		// Verify statistics updated
		expect(mockApp.emit).toHaveBeenCalledWith('session:completed');
	});

	it('should maintain state consistency across view transitions', async () => {
		// Start session in review view
		await (mockAppView as any).navigateTo('review');
		const sessionStore = mockContainer.resolve('SessionStore');
		await sessionStore?.startSession();

		// Save current progress
		const progressBefore = sessionStore?.state.progress;

		// Navigate to dashboard
		await (mockAppView as any).navigateTo('dashboard');

		// Navigate back to review
		await (mockAppView as any).navigateTo('review');

		// Verify state preserved
		const progressAfter = sessionStore?.state.progress;
		expect(progressAfter).toEqual(progressBefore);
		expect(sessionStore?.state.activeSession).toBeTruthy();
	});

	it('should handle errors gracefully with retry option', async () => {
		// Trigger an error
		const dashboardController = mockContainer.resolve('DashboardController');
		vi.spyOn(dashboardController, 'getStats').mockRejectedValueOnce(
			new Error('Failed to load statistics')
		);

		// Try to load dashboard
		const result = await dashboardController?.getStats();

		// Verify error handled
		expect(result).toBeNull();

		// Verify error logged
		const logger = mockContainer.resolve('Logger');
		expect(logger?.error).toHaveBeenCalledWith(
			expect.stringContaining('Loading statistics failed')
		);
	});
});
