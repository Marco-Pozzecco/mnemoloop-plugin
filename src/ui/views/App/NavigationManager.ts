import {
	INavigationManager,
	NavigationStateSchema,
	type DashboardContext,
	type NavigationState,
	type ReviewContext,
} from '@/ui/stores/types';
import type { App, WorkspaceLeaf } from 'obsidian';
import { writable } from 'svelte/store';

// Export navigation state as Svelte store for reactive components
export const navigationState = writable<NavigationState>({
	currentView: 'dashboard',
	reviewContext: null,
	dashboardContext: {
		selectedPeriod: '7days',
		showDetails: false,
	},
});

/**
 * Manages unified plugin interface navigation state and view transitions.
 * Implements the INavigationManager interface for unified view functionality.
 */
export class NavigationManager implements INavigationManager {
	private app: App;
	private leaf: WorkspaceLeaf | null = null;
	private readonly UNIFIED_VIEW_TYPE = 'knowledge-accelerator-home';

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Initializes the navigation state to dashboard view.
	 * Loads persisted state if available.
	 */
	async initialize(): Promise<void> {
		try {
			await this.load();
			if (!this.leaf) {
				await this.openUnifiedView();
			}
		} catch (error) {
			console.error('Failed to initialize NavigationManager:', error);
			// Fallback to default state
			navigationState.set({
				currentView: 'dashboard',
				reviewContext: null,
				dashboardContext: {
					selectedPeriod: '7days',
					showDetails: false,
				},
			});
		}
	}

	/**
	 * Navigates to the specified view.
	 * @param view - Target view ("dashboard" or "review")
	 * @param context - Optional context data for the target view
	 */
	async navigateTo(
		view: 'dashboard' | 'review',
		context?: ReviewContext | DashboardContext,
	): Promise<void> {
		try {
			const currentState = this.getState();

			// Validate transition
			if (currentState.currentView === view) {
				throw new Error(`Invalid navigation: already in ${view} view`);
			}

			// Update navigation state
			const newState: NavigationState = {
				currentView: view,
				reviewContext: view === 'review' ? (context as ReviewContext) : null,
				dashboardContext:
					view === 'dashboard'
						? ((context as DashboardContext) ?? currentState.dashboardContext)
						: null,
			};

			navigationState.set(newState);
			await this.save();
		} catch (error) {
			console.error('Navigation failed:', error);
			throw error;
		}
	}

	/**
	 * Returns the current navigation state.
	 */
	getState(): NavigationState {
		let state: NavigationState;
		navigationState.subscribe((s) => {
			state = s;
		})();
		return state!;
	}

	/**
	 * Updates the review context (e.g., during session).
	 * @param context - New review context
	 */
	updateReviewContext(context: ReviewContext): void {
		navigationState.update((state) => ({
			...state,
			reviewContext: context,
		}));
		void this.save();
	}

	/**
	 * Updates the dashboard context (e.g., period selection).
	 * @param context - New dashboard context
	 */
	updateDashboardContext(context: DashboardContext): void {
		navigationState.update((state) => ({
			...state,
			reviewContext: null,
			dashboardContext: context,
		}));
		void this.save();
	}

	/**
	 * Opens the unified view in a new ribbon-icon leaf.
	 * @returns Promise that resolves when view is opened
	 */
	async openUnifiedView(): Promise<void> {
		try {
			if (this.leaf) {
				// If leaf already exists, just focus it
				this.app.workspace.revealLeaf(this.leaf);
				return;
			}

			// Create new workspace leaf
			this.leaf = this.app.workspace.getRightLeaf(false);

			if (!this.leaf) {
				throw new Error('Failed to create workspace leaf');
			}

			// Set custom view type and open
			this.leaf.setViewState({
				type: this.UNIFIED_VIEW_TYPE,
				active: true,
			});

			// Update workspace
			this.app.workspace.revealLeaf(this.leaf);
		} catch (error) {
			console.error('Failed to open unified view:', error);
			throw error;
		}
	}

	/**
	 * Closes the unified view.
	 */
	closeUnifiedView(): void {
		try {
			if (this.leaf) {
				this.leaf.detach();
				this.leaf = null;
			}
		} catch (error) {
			console.error('Failed to close unified view:', error);
		}
	}

	/**
	 * Persists the current navigation state to plugin settings.
	 * Called on state changes.
	 */
	async save(): Promise<void> {
		try {
			const state = this.getState();

			// Save to plugin settings - use type assertion for plugins
			const plugin = (this.app as any).plugins?.getPlugin('obs-knowledge-accelerator');
			if (plugin && plugin.settings) {
				plugin.settings.navigationState = state;
				await plugin.saveSettings();
			}
		} catch (error) {
			console.error('Failed to save navigation state:', error);
			// Graceful fallback - don't throw to avoid disrupting main flow
		}
	}

	/**
	 * Loads navigation state from plugin settings.
	 */
	async load(): Promise<void> {
		try {
			const plugin = (this.app as any).plugins?.getPlugin('obs-knowledge-accelerator');
			if (plugin?.settings?.navigationState) {
				const validState = NavigationStateSchema.parse(plugin.settings.navigationState);
				navigationState.set(validState);
				console.log('[NavigationManager] Loaded navigation state:', validState);
			} else {
				console.log('[NavigationManager] No saved state, using defaults');
			}
		} catch (error) {
			console.error('[NavigationManager] Failed to load navigation state:', error);
			navigationState.set({
				currentView: 'dashboard',
				reviewContext: null,
				dashboardContext: {
					selectedPeriod: '7days',
					showDetails: false,
				},
			});
		}
	}
}
