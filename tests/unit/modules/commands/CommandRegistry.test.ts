import { describe, expect, it, vi } from 'vitest';
import { CommandRegistry } from '@/modules/commands/CommandRegistry';
import { CommandKey } from '@/types/commands';
import { BaseCommand } from '@/modules/commands/BaseCommand';
import type { ICommandDependencies } from '@/interfaces/ICommand';
import { Plugin } from 'obsidian';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

class TestCommand extends BaseCommand {
	readonly id = 'test-command';
	readonly name = 'Test Command';
	onRegister(): void {}
	onUnregister(): void {}
}

function createMockDeps(plugin: Plugin): ICommandDependencies {
	return {
		plugin,
		adapters: new Map() as any,
		indexes: new Map() as any,
		parsers: new Map() as any,
		writers: new Map() as any,
	};
}

describe('CommandRegistry', () => {
	it('should register a command', () => {
		const registry = new CommandRegistry();
		const cmd = new TestCommand();
		registry.register(CommandKey.openDashboard, cmd);
		expect(registry.hasCommand(CommandKey.openDashboard)).toBe(true);
	});

	it('should reject duplicate registration', () => {
		const registry = new CommandRegistry();
		const cmd = new TestCommand();
		registry.register(CommandKey.openDashboard, cmd);
		expect(() => registry.register(CommandKey.openDashboard, new TestCommand())).toThrow(
			'Command with key "openDashboard" is already registered',
		);
	});

	it('should initialize all registered commands', () => {
		const registry = new CommandRegistry();
		const cmd1 = new TestCommand();
		const cmd2 = new TestCommand();
		const spy1 = vi.spyOn(cmd1, 'register');
		const spy2 = vi.spyOn(cmd2, 'register');

		registry.register(CommandKey.openDashboard, cmd1);
		registry.register(CommandKey.setAllFlashcardsDueNow, cmd2);

		const plugin = createMockPlugin() as unknown as Plugin;
		registry.initialize(createMockDeps(plugin));

		expect(spy1).toHaveBeenCalledTimes(1);
		expect(spy2).toHaveBeenCalledTimes(1);
	});

	it('should get a command by key', () => {
		const registry = new CommandRegistry();
		const cmd = new TestCommand();
		registry.register(CommandKey.openDashboard, cmd);
		expect(registry.getCommand(CommandKey.openDashboard)).toBe(cmd);
	});

	it('should return undefined for unknown key', () => {
		const registry = new CommandRegistry();
		expect(registry.getCommand(CommandKey.openDashboard)).toBeUndefined();
		expect(registry.hasCommand(CommandKey.openDashboard)).toBe(false);
	});

	it('should unregister all commands', () => {
		const registry = new CommandRegistry();
		const cmd = new TestCommand();
		const spy = vi.spyOn(cmd, 'unregister');

		registry.register(CommandKey.openDashboard, cmd);
		registry.unregisterAll();

		expect(spy).toHaveBeenCalledTimes(1);
		expect(registry.hasCommand(CommandKey.openDashboard)).toBe(false);
	});
});
