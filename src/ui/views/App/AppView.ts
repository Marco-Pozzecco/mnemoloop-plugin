import { Logger } from '@/utils/Logger';
import { App, ItemView, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { default as Home } from './App.svelte';
import { AppProps } from './types';

export const APP_VIEW = 'mnemoloop-home';

export class AppView extends ItemView {
	private _app: App;

	private _component: ReturnType<typeof mount> | null = null;
	protected viewType: string = APP_VIEW;

	constructor(app: App, leaf: WorkspaceLeaf) {
		super(leaf);
		this._app = app;
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
		return 'Mnemoloop';
	}

	/**
	 * Returns the icon for the view
	 */
	getIcon(): string {
		return 'orbit';
	}

	/**
	 * Called when the view is opened in the workspace
	 */
	// eslint-disable-next-line @typescript-eslint/require-await
	async onOpen(): Promise<void> {
		try {
			// Load the Svelte component
			this._component = mount(Home, {
				target: this.contentEl,
				props: {
					app: this._app,
					component: this,
				} as AppProps,
			});
		} catch (error) {
			Logger.error('Failed to open Home view:', error);
			this.containerEl.createEl('div', { text: 'Failed to load Mnemoloop' });
		}
	}

	/**
	 * Called when the view is closed
	 */
	async onClose(): Promise<void> {
		try {
			// Clean up Svelte component
			if (this._component) {
				await unmount(this._component);
				this._component = null;
			}
		} catch (error) {
			Logger.error('Failed to close Home view:', error);
		}
	}
}
