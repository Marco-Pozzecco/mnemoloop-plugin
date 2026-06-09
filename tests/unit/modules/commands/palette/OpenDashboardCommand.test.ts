import { describe, expect, it, vi } from 'vitest';
import { OpenDashboardCommand } from '@/modules/commands/palette/OpenDashboardCommand';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';

vi.mock('@/ui/views/App/AppView', () => ({
	APP_VIEW: 'mnemoloop-home',
}));

const APP_VIEW = 'mnemoloop-home';

describe('OpenDashboardCommand', () => {
	function setup() {
		const cmd = new OpenDashboardCommand();
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

	it('should register command with correct id and name', () => {
		const { addCommandSpy } = setup();
		expect(addCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'open-dashboard',
				name: 'Open dashboard',
			}),
		);
	});

	it('should reveal existing leaf when view is already open', async () => {
		const { plugin, addCommandSpy } = setup();
		const existingLeaf = { setViewState: vi.fn() };
		plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([existingLeaf]);
		plugin.app.workspace.revealLeaf = vi.fn();

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(plugin.app.workspace.getLeavesOfType).toHaveBeenCalledWith(APP_VIEW);
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(existingLeaf);
		expect(existingLeaf.setViewState).not.toHaveBeenCalled();
	});

	it('should create new leaf and set view state when no leaf exists', async () => {
		const { plugin, addCommandSpy } = setup();
		const newLeaf = { setViewState: vi.fn() };
		plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
		plugin.app.workspace.getLeaf = vi.fn().mockReturnValue(newLeaf);
		plugin.app.workspace.revealLeaf = vi.fn();

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(plugin.app.workspace.getLeaf).toHaveBeenCalledWith(false);
		expect(newLeaf.setViewState).toHaveBeenCalledWith({ type: 'mnemoloop-home', active: true });
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(newLeaf);
	});
});
