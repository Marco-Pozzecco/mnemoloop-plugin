import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateFlashcardFromFileCommand } from '@/modules/commands/file-menu/CreateFlashcardFromFileCommand';
import { EventBus } from '@/modules/events/core/EventBus';
import { FlashcardWriterCreateRequestEvent, FlashcardWriterCreateResponseEvent } from '@/modules/events';
import { TFile } from 'obsidian';
import { resetSingletons } from '../../../../helpers/reset-singletons';
import { createMockPlugin, createMockMenu } from '../../../../helpers/mock-obsidian';

describe('CreateFlashcardFromFileCommand', () => {
	beforeEach(() => {
		resetSingletons();
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
		expect(item.setIcon).toHaveBeenCalledWith('brain');
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

	it('should open file in split leaf when one or fewer root leaves', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		const newLeaf = { openFile: vi.fn() };
		plugin.app.workspace.iterateRootLeaves = vi.fn().mockImplementation((cb: (leaf: any) => void) => {
			cb({ parent: { id: 'parent-1' } });
		});
		plugin.app.workspace.getLeaf = vi.fn().mockReturnValue(newLeaf);
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

		expect(plugin.app.workspace.getLeaf).toHaveBeenCalledWith('split');
		expect(newLeaf.openFile).toHaveBeenCalled();
	});

	it('should open file in new leaf when more than one root leaves', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		const rightLeaf = { parent: { id: 'parent-right' } };
		const newLeaf = { openFile: vi.fn() };
		plugin.app.workspace.iterateRootLeaves = vi.fn().mockImplementation((cb: (leaf: any) => void) => {
			cb({ id: 'leaf-1', parent: { id: 'parent-1' } });
			cb(rightLeaf);
		});
		plugin.app.workspace.createLeafInParent = vi.fn().mockReturnValue(newLeaf);
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

		expect(plugin.app.workspace.createLeafInParent).toHaveBeenCalledWith(rightLeaf.parent, -1);
		expect(newLeaf.openFile).toHaveBeenCalled();
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
