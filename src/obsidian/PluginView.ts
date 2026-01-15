import { ItemView, WorkspaceLeaf, type ViewStateResult } from 'obsidian';
import { get } from 'svelte/store';
import type { SvelteComponent } from 'svelte';
import { ViewState } from '../ui/types';
import { uiStore } from '../ui/stores/UIStore';
import { IndexManager, StatsManager } from '@/core/indexer';
import { DueQueueManager } from '@/core';
import { SessionStore } from '@/ui/stores/SessionStore';

/**
 * Base class for all plugin views in Obsidian.
 *
 * This abstraction provides:
 * 1. Svelte component lifecycle management (mount/unmount)
 * 2. Integration with Obsidian's workspace and leaf system
 * 3. Unified state management via UIStore
 * 4. Automatic cleanup to prevent memory leaks
 * 5. Support for theme changes and error handling
 */
export abstract class PluginView extends ItemView {
	/** Reference to the mounted Svelte component instance */
	protected component?: SvelteComponent;

	/** Unique identifier for the view type (must be unique across all Obsidian views) */
	protected abstract viewType: string;
	/** Text displayed in the view tab/header */
	protected abstract displayText: string;
	/** Icon identifier from Obsidian's internal icon set */
	public abstract icon: string;

	protected statsManager: StatsManager;
	protected indexManager: IndexManager;
	protected sessionStore: SessionStore;
	protected dueQueue: DueQueueManager;

	/**
	 * @param leaf - The workspace leaf this view will reside in
	 */
	constructor(
		leaf: WorkspaceLeaf,
		indexManager: IndexManager,
		statsManager: StatsManager,
		sessionStore: SessionStore,
		dueQueue: DueQueueManager,
	) {
		super(leaf);
		this.indexManager = indexManager;
		this.statsManager = statsManager;
		this.sessionStore = sessionStore;
		this.dueQueue = dueQueue;
	}

	/**
	 * Returns the unique identifier for this view type.
	 * @override
	 */
	getViewType(): string {
		return this.viewType;
	}

	/**
	 * Returns the text to display in the view tab.
	 * @override
	 */
	getDisplayText(): string {
		return this.displayText;
	}

	/**
	 * Returns the icon to display in the view tab.
	 * @override
	 */
	getIcon(): string {
		return this.icon;
	}

	/**
	 * Called when the view is opened.
	 * Initializes the container and mounts the Svelte component.
	 * @override
	 */
	async onOpen(): Promise<void> {
		// The view container's content area is the second child
		const container = this.containerEl.children[1];
		container.empty();

		try {
			// Create and mount the specific Svelte component for this view
			this.component = this.createSvelteComponent(container);

			// Register for theme changes to allow components to react if needed
			this.registerEvent(
				this.app.workspace.on('css-change', () => {
					this.handleThemeChange();
				}),
			);
		} catch (error) {
			console.error(`Failed to initialize view ${this.viewType}:`, error);
			this.displayError('Failed to load view. Please try reloading the plugin.');
		}
	}

	/**
	 * Called when the view is closed.
	 * Ensures proper cleanup of the Svelte component to prevent memory leaks.
	 * @override
	 */
	async onClose(): Promise<void> {
		if (this.component) {
			this.component.$destroy();
			this.component = undefined;
		}
	}

	/**
	 * Abstract method that subclasses must implement to instantiate their specific Svelte component.
	 *
	 * @param container - The DOM element to mount the component into
	 * @returns The instantiated Svelte component
	 */
	protected abstract createSvelteComponent(container: Element): SvelteComponent;

	/**
	 * Hook for handling theme changes (light/dark mode).
	 * Subclasses can override this if they need specific logic when switching themes.
	 */
	protected handleThemeChange(): void {
		// Default implementation is empty as most Svelte components
		// will react to Obsidian's CSS variables automatically.
	}

	/**
	 * Updates the view state. Used by Obsidian for navigation and history.
	 * Synchronizes the internal UIStore with Obsidian's view state.
	 *
	 * @param state - The new state to apply
	 * @param result - Result object for the state change
	 * @override
	 */
	async setState(state: any, result: ViewStateResult): Promise<void> {
		if (state.view) {
			uiStore.navigate(state.view as ViewState);
		}
		await super.setState(state, result);
	}

	/**
	 * Returns the current view state for persistence.
	 *
	 * @returns The current state object
	 * @override
	 */
	getState(): any {
		const state = super.getState();

		return {
			...state,
			view: get(uiStore).currentView,
		};
	}

	/**
	 * Helper method to show an error in the view via the global UI store.
	 *
	 * @param message - Error message to display
	 * @param retry - Optional retry callback
	 */
	protected displayError(message: string, retry?: () => void): void {
		uiStore.setError(message, undefined, retry);
	}

	/**
	 * Helper method to set the loading state of the view.
	 *
	 * @param isLoading - Whether the view is loading
	 * @param message - Optional loading message
	 */
	protected setLoading(isLoading: boolean, message?: string): void {
		uiStore.setLoading(isLoading, message);
	}
}
