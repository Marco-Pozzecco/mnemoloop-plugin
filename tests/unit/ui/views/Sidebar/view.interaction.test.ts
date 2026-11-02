// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App, WorkspaceLeaf } from 'obsidian';
import { sidebarStore } from '@/ui/store/sidebar.store';
import { FlashcardSidebarView, SIDEBAR_VIEW } from '@/ui/views/Sidebar/FlashcardSidebarView';
import { resetSingletons } from '../../../../helpers/reset-singletons';

function createApp(): App {
	return {
		vault: {
			getName: () => 'test-vault',
			getFiles: () => [],
			getFileByPath: () => null,
			getResourcePath: () => '',
		},
		workspace: {
			getActiveFile: () => null,
			on: () => ({}),
			offref: () => undefined,
		},
	} as unknown as App;
}

describe('FlashcardSidebarView', () => {
	let view: FlashcardSidebarView;
	let contentEl: HTMLDivElement;

	beforeEach(() => {
		resetSingletons();
		sidebarStore.reset();
		view = new FlashcardSidebarView(createApp(), {} as WorkspaceLeaf);
		contentEl = document.createElement('div');
		(view as unknown as { contentEl: HTMLElement }).contentEl = contentEl;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('identifies itself as the sidebar view', () => {
		expect(view.getViewType()).toBe(SIDEBAR_VIEW);
		expect(view.getDisplayText()).toBe('Flashcards');
	});

	it('mounts the panel into contentEl and unmounts it on close', async () => {
		await view.onOpen();
		expect(contentEl.querySelector('.ml-flashcard-sidebar')).not.toBeNull();

		await view.onClose();
		expect(contentEl.querySelector('.ml-flashcard-sidebar')).toBeNull();
	});

	it('round-trips its collapsed groups through the view state', async () => {
		await view.setState({ collapsedGroups: ['ACTIVE', 'PAUSED'] });
		expect(view.getState()).toEqual({ collapsedGroups: ['ACTIVE', 'PAUSED'] });

		await view.setState({});
		expect(view.getState()).toEqual({ collapsedGroups: [] });
	});
});
