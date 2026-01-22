import type { App } from 'obsidian';
import { NavigationManager } from './NavigationManager';
import { ItemView, WorkspaceLeaf } from 'obsidian';

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
	protected viewType: string = APP_VIEW;

	constructor(leaf: WorkspaceLeaf, app: App) {
		super(leaf);
		this.navigationManager = new NavigationManager(app);
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
			// Initialize the navigation manager
			await this.navigationManager.initialize();

			// Load the Svelte component
			const { default: Home } = await import('./App.svelte');
			const homeComponent = new Home({
				target: this.containerEl,
				// props: {
				// 	app: this.app,
				// 	navigationManager: this.navigationManager,
				// },
			});

			// Store component reference for cleanup
			(this as any).homeComponent = homeComponent;
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
			if ((this as any).homeComponent) {
				(this as any).homeComponent.$destroy();
				delete (this as any).homeComponent;
			}

			// Close unified view
			this.navigationManager.closeUnifiedView();
		} catch (error) {
			console.error('Failed to close Home view:', error);
		}
	}
}
