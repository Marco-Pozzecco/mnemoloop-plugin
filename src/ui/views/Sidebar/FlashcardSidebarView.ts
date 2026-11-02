import { Logger } from '@/utils/Logger';
import { ItemView } from 'obsidian';
import type { App, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { default as SidebarPanel } from './component.svelte';
import type SidebarProps from '@/ui/views/Sidebar/types';
import { SIDEBAR_VIEW } from './constants';

export { SIDEBAR_VIEW } from './constants';

export class FlashcardSidebarView extends ItemView {
	private _app: App;
	private _component: ReturnType<typeof mount> | null = null;
	/** Status groups the user collapsed; serialized with the workspace layout. */
	private _collapsedGroups: string[] = [];
	protected viewType: string = SIDEBAR_VIEW;

	constructor(app: App, leaf: WorkspaceLeaf) {
		super(leaf);
		this._app = app;
	}

	getViewType(): string {
		return SIDEBAR_VIEW;
	}

	getDisplayText(): string {
		return 'Flashcards';
	}

	getIcon(): string {
		return 'orbit';
	}

	/**
	 * The view's own state, so Obsidian restores the collapsed groups with the
	 * workspace layout and the plugin persists nothing of its own.
	 */
	getState(): Record<string, unknown> {
		return { collapsedGroups: [...this._collapsedGroups] };
	}

	async setState(state: unknown): Promise<void> {
		const collapsed = (state as { collapsedGroups?: unknown } | null)?.collapsedGroups;
		this._collapsedGroups = Array.isArray(collapsed)
			? collapsed.filter((value): value is string => typeof value === 'string')
			: [];
	}

	async onOpen(): Promise<void> {
		try {
			this._component = mount(SidebarPanel, {
				target: this.contentEl,
				props: {
					app: this._app,
					component: this,
					collapsedGroups: [...this._collapsedGroups],
					onCollapsedGroupsChange: (groups: string[]) => {
						this._collapsedGroups = [...groups];
					},
				} as SidebarProps,
			});
		} catch (error) {
			Logger.error('Failed to open flashcard sidebar:', error);
			this.containerEl.createEl('div', { text: 'Failed to load flashcards' });
		}
	}

	async onClose(): Promise<void> {
		try {
			if (this._component) {
				await unmount(this._component);
				this._component = null;
			}
		} catch (error) {
			Logger.error('Failed to close flashcard sidebar:', error);
		}
	}
}
