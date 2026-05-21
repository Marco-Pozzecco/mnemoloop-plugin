import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateFlashcardFromFileCommand } from '@/modules/commands/file-menu/CreateFlashcardFromFileCommand';
import { EventBus } from '@/modules/events/core/EventBus';
import { FlashcardWriterCreateRequestEvent, FlashcardWriterCreateResponseEvent } from '@/modules/events';
import { TFile } from 'obsidian';
import { openInSplitMode } from '@/utils/Workspace';
import { resetSingletons } from '../../../../helpers/reset-singletons';
import { createMockPlugin, createMockMenu } from '../../../../helpers/mock-obsidian';

vi.mock('@/utils/Workspace', () => ({
	openInSplitMode: vi.fn(),
}));

describe('CreateFlashcardFromFileCommand', () => {
	beforeEach(() => {
		resetSingletons();
		vi.mocked(openInSplitMode).mockReset();
		vi.mocked(openInSplitMode).mockReturnValue({ openFile: vi.fn().mockResolvedValue(undefined) });
	});

	function setup() {
		const cmd = new CreateFlashcardFromFileCommand();
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

	function triggerFileMenu(plugin: any, file: any) {
		const calls = (plugin.app.workspace.on as any).mock.calls;
		const menuHandler = calls.find((c: any[]) => c[0] === 'file-menu')?.[1];
		if (!menuHandler) throw new Error('file-menu handler not found');

		const menu = createMockMenu();
		menuHandler(menu, file);
		return { menu, item: menu._items[0] };
	}

	it('should register workspace file-menu event', () => {
		const { workspaceOnSpy } = setup();
		expect(workspaceOnSpy).toHaveBeenCalledWith('file-menu', expect.any(Function));
	});

	it('should add menu item for markdown TFile', () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');

		const { menu } = triggerFileMenu(plugin, file);

		expect(menu.addItem).toHaveBeenCalledTimes(1);
		const item = menu._items[0];
		expect(item.setTitle).toHaveBeenCalledWith('Create flashcard from file');
		expect(item.setIcon).toHaveBeenCalledWith('file-plus');
	});

	it('should not add menu item for non-TFile', () => {
		const { plugin } = setup();
		const file = { path: 'notes/folder', extension: '' };

		const { menu } = triggerFileMenu(plugin, file);

		expect(menu.addItem).not.toHaveBeenCalled();
	});

	it('should not add menu item for non-md file', () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.txt', 'test');

		const { menu } = triggerFileMenu(plugin, file);

		expect(menu.addItem).not.toHaveBeenCalled();
	});

	it('should publish FlashcardWriterCreateRequestEvent on click', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		const { item } = triggerFileMenu(plugin, file);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		expect(publishSpy).toHaveBeenCalledTimes(1);
		const event = publishSpy.mock.calls[0][0] as FlashcardWriterCreateRequestEvent;
		expect(event.type).toBe(FlashcardWriterCreateRequestEvent.type);
		expect(event.data).toEqual({
			back: '',
			front: '',
			source: 'notes/test.md',
		});
	});

	it('should open file via openInSplitMode utility when single column', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		const mockSourceLeaf = { id: 'source-leaf' };
		const newLeaf = { openFile: vi.fn() };
		vi.mocked(openInSplitMode).mockReturnValue(newLeaf);
		plugin.app.workspace.getMostRecentLeaf = vi.fn().mockReturnValue(mockSourceLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();
		plugin.app.vault.getFileByPath = vi.fn().mockReturnValue(new (TFile as any)('flashcards/new.md', 'new'));

		const { item } = triggerFileMenu(plugin, file);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const responseEvent = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid',
			filepath: 'flashcards/new.md',
			source: 'notes/test.md',
			request_id: 'req-id',
		});
		EventBus.instance.publish(responseEvent);
		await Promise.resolve();

		expect(openInSplitMode).toHaveBeenCalledWith(plugin.app.workspace);
		expect(newLeaf.openFile).toHaveBeenCalled();
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(mockSourceLeaf);
	});

	it('should open file via openInSplitMode utility when already split', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		const newLeaf = { openFile: vi.fn() };
		const mockSourceLeaf = { id: 'source-leaf' };
		vi.mocked(openInSplitMode).mockReturnValue(newLeaf);
		plugin.app.workspace.getMostRecentLeaf = vi.fn().mockReturnValue(mockSourceLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();
		plugin.app.vault.getFileByPath = vi.fn().mockReturnValue(new (TFile as any)('flashcards/new.md', 'new'));

		const { item } = triggerFileMenu(plugin, file);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const responseEvent = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid',
			filepath: 'flashcards/new.md',
			source: 'notes/test.md',
			request_id: 'req-id',
		});
		EventBus.instance.publish(responseEvent);
		await Promise.resolve();

		expect(openInSplitMode).toHaveBeenCalledWith(plugin.app.workspace);
		expect(newLeaf.openFile).toHaveBeenCalled();
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(mockSourceLeaf);
	});

	it('should unsubscribe when file not found on response', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		plugin.app.vault.getFileByPath = vi.fn().mockReturnValue(null);

		const { item } = triggerFileMenu(plugin, file);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		const unsubscribeSpy = vi.spyOn(EventBus.instance, 'unsubscribe');

		const responseEvent = new FlashcardWriterCreateResponseEvent({
			uuid: 'test-uuid',
			filepath: 'flashcards/nonexistent.md',
			source: 'notes/test.md',
			request_id: 'req-id',
		});
		EventBus.instance.publish(responseEvent);

		expect(unsubscribeSpy).toHaveBeenCalled();
	});
});
