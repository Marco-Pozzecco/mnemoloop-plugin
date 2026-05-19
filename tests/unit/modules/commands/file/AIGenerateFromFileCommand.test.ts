import { describe, expect, it, vi } from 'vitest';
import { AIGenerateFromFileCommand } from '@/modules/commands/file-menu/AIGenerateFromFileCommand';
import { TFile } from 'obsidian';
import { createMockPlugin, createMockMenu } from '../../../../helpers/mock-obsidian';

describe('AIGenerateFromFileCommand', () => {
	function setup() {
		const cmd = new AIGenerateFromFileCommand();
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
		expect(item.setTitle).toHaveBeenCalledWith('Generate flashcards from file');
		expect(item.setIcon).toHaveBeenCalledWith('sparks');
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

	it('should read file content on click', async () => {
		const { plugin } = setup();
		const file = new (TFile as any)('notes/test.md', 'test');
		plugin.app.vault.read = vi.fn().mockResolvedValue('# Test content');

		const { item } = triggerFileMenu(plugin, file);
		const onClickHandler = item.onClick.mock.calls[0][0];
		await onClickHandler();

		expect(plugin.app.vault.read).toHaveBeenCalledWith(file);
	});
});
