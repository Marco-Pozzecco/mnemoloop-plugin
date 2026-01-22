import type { App } from 'obsidian';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import type { NavigationManager } from './NavigationManager';
import type { IndexManager } from '@/core/indexer/IndexerManager';
import type { StatisticsManager } from '@/core/statistics';
import type { SessionStore } from '@/ui/stores/SessionStore';
import type { DueQueueManager } from '@/core/srs';
import { SvelteComponent } from 'svelte';
import { default as Home } from './App.svelte';

/**
 * View type for the unified home view
 */
export const APP_VIEW = 'knowledge-accelerator-home';

/**
 * Home view class for the unified plugin interface
 * Extends Obsidian's ItemView to integrate with the workspace
 */
export class AppView extends ItemView {
	private navigationManager: NavigationManager;
	private indexManager: IndexManager;
	private statisticsManager: StatisticsManager;
	private sessionStore: SessionStore;
	private dueQueueManager: DueQueueManager;
	private homeComponent: Home | null = null;
	protected viewType: string = APP_VIEW;

	constructor(
		leaf: WorkspaceLeaf,
		app: App,
		navigationManager: NavigationManager,
		indexManager: IndexManager,
		statisticsManager: StatisticsManager,
		sessionStore: SessionStore,
		dueQueueManager: DueQueueManager,
	) {
		super(leaf);
		this.navigationManager = navigationManager;
		this.indexManager = indexManager;
		this.statisticsManager = statisticsManager;
		this.sessionStore = sessionStore;
		this.dueQueueManager = dueQueueManager;
	}

	/**
	 * Returns the view type identifier
	 */
	getViewType(): string {
		return APP_VIEW;
	}

	/**
	 * Returns the display name for the view
	 */
	getDisplayText(): string {
		return 'Knowledge Accelerator';
	}

	/**
	 * Returns the icon for the view
	 */
	getIcon(): string {
		return 'brain';
	}

	/**
	 * Called when the view is opened in the workspace
	 */
	async onOpen(): Promise<void> {
		try {
			// Store the leaf reference in NavigationManager
			this.navigationManager.initializeWithLeaf(this.leaf);

			// Load the Svelte component
			const homeComponent = new Home({
				target: this.contentEl,
				props: {
					app: this.app,
					navigationManager: this.navigationManager,
					indexManager: this.indexManager,
					statisticsManager: this.statisticsManager,
					sessionStore: this.sessionStore,
					dueQueueManager: this.dueQueueManager,
				},
			});

			// Store component reference for cleanup
			this.homeComponent = homeComponent;
		} catch (error) {
			console.error('Failed to open Home view:', error);
			this.containerEl.createEl('div', { text: 'Failed to load Knowledge Accelerator' });
		}
	}

	/**
	 * Called when the view is closed
	 */
	async onClose(): Promise<void> {
		try {
			// Clean up Svelte component
			if (this.homeComponent) {
				this.homeComponent.$destroy();
				this.homeComponent = null;
			}

			// Close unified view
			this.navigationManager.closeUnifiedView();
		} catch (error) {
			console.error('Failed to close Home view:', error);
		}
	}
}
