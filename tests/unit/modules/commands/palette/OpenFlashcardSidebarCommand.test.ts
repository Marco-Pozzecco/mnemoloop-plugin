import { describe, expect, it, vi } from 'vitest';
import { OpenFlashcardSidebarCommand } from '@/modules/commands/palette/OpenFlashcardSidebarCommand';
import { SIDEBAR_VIEW } from '@/ui/views/Sidebar/constants';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';

describe('OpenFlashcardSidebarCommand', () => {
	function setup() {
		const cmd = new OpenFlashcardSidebarCommand();
		const plugin = createMockPlugin();
		const addCommandSpy = vi.spyOn(plugin, 'addCommand');
		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map() as any,
			parsers: new Map() as any,
			writers: new Map() as any,
		});
		return { cmd, plugin, addCommandSpy };
	}

	function commandCallback(addCommandSpy: ReturnType<typeof vi.spyOn>): () => unknown {
		return (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
	}

	it('registers the palette command with its id and name', () => {
		const { addCommandSpy } = setup();
		expect(addCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'open-flashcard-sidebar',
				name: 'Open flashcard sidebar',
			}),
		);
	});

	it('reveals the existing sidebar leaf without creating a second one', async () => {
		const { plugin, addCommandSpy } = setup();
		const existingLeaf = { setViewState: vi.fn() };
		plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([existingLeaf]);
		plugin.app.workspace.revealLeaf = vi.fn();

		await commandCallback(addCommandSpy)();

		expect(plugin.app.workspace.getLeavesOfType).toHaveBeenCalledWith(SIDEBAR_VIEW);
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(existingLeaf);
		expect(plugin.app.workspace.getRightLeaf).not.toHaveBeenCalled();
		expect(existingLeaf.setViewState).not.toHaveBeenCalled();
	});

	it('creates a right-sidebar leaf when none exists', async () => {
		const { plugin, addCommandSpy } = setup();
		const newLeaf = { setViewState: vi.fn() };
		plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
		plugin.app.workspace.getRightLeaf = vi.fn().mockReturnValue(newLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();

		await commandCallback(addCommandSpy)();

		expect(plugin.app.workspace.getRightLeaf).toHaveBeenCalledWith(false);
		expect(newLeaf.setViewState).toHaveBeenCalledWith({ type: SIDEBAR_VIEW, active: true });
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(newLeaf);
	});

	it('does nothing when the right sidebar is unavailable', async () => {
		const { plugin, addCommandSpy } = setup();
		plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
		plugin.app.workspace.getRightLeaf = vi.fn().mockReturnValue(null);
		plugin.app.workspace.revealLeaf = vi.fn();

		await expect(commandCallback(addCommandSpy)()).resolves.toBeUndefined();

		expect(plugin.app.workspace.revealLeaf).not.toHaveBeenCalled();
	});
});
