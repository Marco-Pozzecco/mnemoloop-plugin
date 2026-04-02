import { Indexes } from '@/types/indexes';
import { Logger } from '@/utils/Logger';
import { App, ItemView, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { default as Home } from './App.svelte';
import { AppProps } from './types';

export const APP_VIEW = 'knowledge-accelerator-home';

export class AppView extends ItemView {
	private _app: App;
	private _indexes: Indexes;
	private _component: ReturnType<typeof mount> | null = null;
	protected viewType: string = APP_VIEW;

	constructor(app: App, leaf: WorkspaceLeaf, indexes: Indexes) {
		super(leaf);
		this._app = app;
		this._indexes = indexes;
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
			Logger.info('Opening Knowledge Accelerator view');

			// Load the Svelte component
			this._component = mount(Home, {
				target: this.contentEl,
				props: {
					app: this._app,
					component: this,
					indexes: this._indexes,
				} as AppProps,
			});

			Logger.info('Knowledge Accelerator view opened successfully');
		} catch (error) {
			Logger.error('Failed to open Home view:', error);
			this.containerEl.createEl('div', { text: 'Failed to load Knowledge Accelerator' });
		}
	}

	/**
	 * Called when the view is closed
	 */
	async onClose(): Promise<void> {
		try {
			Logger.info('Closing Knowledge Accelerator view');

			// Clean up Svelte component
			if (this._component) {
				unmount(this._component);
				this._component = null;
			}

			Logger.info('Knowledge Accelerator view closed successfully');
		} catch (error) {
			Logger.error('Failed to close Home view:', error);
		}
	}
}
