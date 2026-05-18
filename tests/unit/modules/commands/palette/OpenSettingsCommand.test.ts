import { describe, expect, it, vi } from 'vitest';
import { OpenSettingsCommand } from '@/modules/commands/palette/OpenSettingsCommand';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';

describe('OpenSettingsCommand', () => {
	function setup() {
		const cmd = new OpenSettingsCommand();
		const plugin = createMockPlugin();
		const addCommandSpy = vi.spyOn(plugin, 'addCommand');
		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map() as any,
			parsers: new Map() as any,
		});
		return { cmd, plugin, addCommandSpy };
	}

	it('should register command with correct id and name', () => {
		const { addCommandSpy } = setup();
		expect(addCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'open-settings',
				name: 'Open Settings',
			}),
		);
	});

	it('should have empty callback that does not throw', async () => {
		const { addCommandSpy } = setup();
		const callback = addCommandSpy.mock.calls[0][0].callback;
		await expect(callback()).resolves.not.toThrow();
	});
});
