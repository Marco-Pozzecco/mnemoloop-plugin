import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GenerateFromSelectionCommand } from '@/modules/commands/editor-menu/GenerateFromSelectionCommand';
import { EventBus } from '@/modules/events/core/EventBus';
import { FlashcardWriterCreateResponseEvent } from '@/modules/events';
import { TFile, MarkdownView, Notice } from 'obsidian';
import { openInSplitMode } from '@/utils/Workspace';
import { resetSingletons } from '../../../../helpers/reset-singletons';
import { createMockPlugin, createMockEditor, createMockMenu } from '../../../../helpers/mock-obsidian';

vi.mock('@/ui/views/Modal/ModalView', () => ({
	SvelteModal: vi.fn().mockImplementation(() => ({
		open: vi.fn(),
	})),
}));

vi.mock('@/ui/store/modal.store', () => ({
	modalStore: {
		open: vi.fn(),
		close: vi.fn(),
	},
	ModalViewEnum: {
		flashcard: 'flashcard',
	},
}));

vi.mock('@/utils/Workspace', () => ({
	openInSplitMode: vi.fn(),
}));

describe('GenerateFromSelectionCommand', () => {
	beforeEach(() => {
		resetSingletons();
		vi.mocked(openInSplitMode).mockReset();
		vi.mocked(openInSplitMode).mockReturnValue({ openFile: vi.fn().mockResolvedValue(undefined) });
	});

	function setup() {
		const cmd = new GenerateFromSelectionCommand();
		const plugin = createMockPlugin();
		const workspaceOnSpy = vi.spyOn(plugin.app.workspace, 'on');
		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map() as any,
			parsers: new Map() as any,
		});
		return { cmd, plugin, workspaceOnSpy };
	}

	function triggerEditorMenu(plugin: any, editor: any, view: any) {
		const calls = (plugin.app.workspace.on as any).mock.calls;
		const menuHandler = calls.find((c: any[]) => c[0] === 'editor-menu')?.[1];
		if (!menuHandler) throw new Error('editor-menu handler not found');

		const menu = createMockMenu();
		menuHandler(menu, editor, view);
		return { menu, item: menu._items[0] };
	}

	it('should register workspace editor-menu event', () => {
		const { workspaceOnSpy } = setup();
		expect(workspaceOnSpy).toHaveBeenCalledWith('editor-menu', expect.any(Function));
	});

	it('should add menu item with correct title and icon', () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };

		const { menu } = triggerEditorMenu(plugin, editor, view);

		expect(menu.addItem).toHaveBeenCalledTimes(1);
		const item = menu._items[0];
		expect(item.setTitle).toHaveBeenCalledWith('Generate flashcard from selection');
		expect(item.setIcon).toHaveBeenCalledWith('highlighter');
	});

	it('should show Notice when no selection', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', '');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		expect(Notice).toHaveBeenCalledWith('Please select text to generate a flashcard');
	});

	it('should show Notice when no filepath', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = null;

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		expect(Notice).toHaveBeenCalledWith('Impossible to get file path');
	});

	it('should open modal and subscribe to response on valid selection', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const { modalStore } = await import('@/ui/store/modal.store');
		expect(modalStore.open).toHaveBeenCalledWith(
			'flashcard',
			expect.objectContaining({
				back: 'selected text',
				filepath: 'notes/test.md',
			}),
		);

		const { SvelteModal } = await import('@/ui/views/Modal/ModalView');
		expect(SvelteModal).toHaveBeenCalledWith(plugin.app, 'ml-flashcard-modal');
	});

	it('should open created file via openInSplitMode utility when single column', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };
		(view as any).leaf = { id: 'original-leaf' };

		const newLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
		vi.mocked(openInSplitMode).mockReturnValue(newLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();
		plugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(new (TFile as any)('notes/test.md', 'test'));

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const responseEvent = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid',
			filepath: 'notes/test.md',
			source: 'notes/test.md',
			request_id: 'req-id',
		});
		EventBus.instance.publish(responseEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(openInSplitMode).toHaveBeenCalledWith(plugin.app.workspace);
		expect(newLeaf.openFile).toHaveBeenCalled();
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith((view as any).leaf);
	});

	it('should open created file via openInSplitMode utility when already split', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };
		(view as any).leaf = { id: 'original-leaf' };

		const newLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
		vi.mocked(openInSplitMode).mockReturnValue(newLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();
		plugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(new (TFile as any)('notes/test.md', 'test'));

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const responseEvent = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid',
			filepath: 'notes/test.md',
			source: 'notes/test.md',
			request_id: 'req-id',
		});
		EventBus.instance.publish(responseEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(openInSplitMode).toHaveBeenCalledWith(plugin.app.workspace);
		expect(newLeaf.openFile).toHaveBeenCalled();
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith((view as any).leaf);
	});

	it('should not open file when response file is not a TFile', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };

		plugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue({ path: 'notes/test.md' });

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const responseEvent = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid',
			filepath: 'notes/test.md',
			source: 'notes/test.md',
			request_id: 'req-id',
		});
		EventBus.instance.publish(responseEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(plugin.app.vault.getAbstractFileByPath).toHaveBeenCalledWith('notes/test.md');
		expect(openInSplitMode).not.toHaveBeenCalled();
	});

	it('should not process unrelated event types', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		// Publish a fake unrelated event
		const fakeEvent = {
			id: 'fake-id',
			type: 'some-unrelated-event',
			time: new Date(),
			data: undefined,
			isType: () => false,
			toJSON: () => ({ type: 'some-unrelated-event', data: undefined, timestamp: new Date().toISOString() }),
		} as any;
		EventBus.instance.publish(fakeEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));

		// The callback should NOT have fired for this event type
		expect(openInSplitMode).not.toHaveBeenCalled();
	});

	it('should unsubscribe after processing response event', async () => {
		const { plugin } = setup();
		const editor = createMockEditor('content', 'selected text');
		const view = new MarkdownView({} as any);
		(view as any).file = { path: 'notes/test.md' };
		(view as any).leaf = { id: 'original-leaf' };

		const newLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
		vi.mocked(openInSplitMode).mockReturnValue(newLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();
		plugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(new (TFile as any)('notes/test.md', 'test'));

		const { item } = triggerEditorMenu(plugin, editor, view);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		// First response event
		const responseEvent1 = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid-1',
			filepath: 'notes/test.md',
			source: 'notes/test.md',
			request_id: 'req-id-1',
		});
		EventBus.instance.publish(responseEvent1);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(newLeaf.openFile).toHaveBeenCalledTimes(1);

		// Second response event - should NOT be processed
		const responseEvent2 = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid-2',
			filepath: 'notes/test.md',
			source: 'notes/test.md',
			request_id: 'req-id-2',
		});
		EventBus.instance.publish(responseEvent2);
		await new Promise((resolve) => setTimeout(resolve, 0));

		// openFile should still only have been called once
		expect(newLeaf.openFile).toHaveBeenCalledTimes(1);
	});
});
