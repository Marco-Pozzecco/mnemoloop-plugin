import { describe, expect, it } from 'vitest';
import { Plugin } from 'obsidian';
import { BaseCommand } from '@/modules/commands/BaseCommand';
import type { ICommandDependencies } from '@/interfaces/ICommand';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

class TestCommand extends BaseCommand {
	readonly id = 'test-command';
	readonly name = 'Test Command';
	registered = false;
	unregistered = false;

	onRegister(): void {
		this.registered = true;
	}

	onUnregister(): void {
		this.unregistered = true;
	}

	// Expose protected getters for testing
	getPlugin() {
		return this.plugin;
	}
	getAdapters() {
		return this.adapters;
	}
	getIndexes() {
		return this.indexes;
	}
	getParsers() {
		return this.parsers;
	}
	getWriters() {
		return this.writers;
	}
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

describe('BaseCommand', () => {
	it('should throw when accessing getters before register', () => {
		const cmd = new TestCommand();
		expect(() => cmd.getPlugin()).toThrow('Command dependencies not initialized');
		expect(() => cmd.getAdapters()).toThrow('Command dependencies not initialized');
		expect(() => cmd.getIndexes()).toThrow('Command dependencies not initialized');
		expect(() => cmd.getParsers()).toThrow('Command dependencies not initialized');
		expect(() => cmd.getWriters()).toThrow('Command dependencies not initialized');
	});

	it('should set deps and call onRegister during register', () => {
		const cmd = new TestCommand();
		const plugin = createMockPlugin() as unknown as Plugin;
		const deps = createMockDeps(plugin);
		cmd.register(deps);
		expect(cmd.registered).toBe(true);
		expect(cmd.getPlugin()).toBe(plugin);
	});
	it('should allow accessing all getters after register', () => {
		const cmd = new TestCommand();
		const plugin = createMockPlugin() as unknown as Plugin;
		const deps = createMockDeps(plugin);
		cmd.register(deps);
		expect(cmd.getAdapters()).toBe(deps.adapters);
		expect(cmd.getIndexes()).toBe(deps.indexes);
		expect(cmd.getParsers()).toBe(deps.parsers);
		expect(cmd.getWriters()).toBe(deps.writers);
	});

	it('should call onUnregister and clear deps during unregister', () => {
		const cmd = new TestCommand();
		const plugin = createMockPlugin() as unknown as Plugin;
		const deps = createMockDeps(plugin);
		cmd.register(deps);
		cmd.unregister();
		expect(cmd.unregistered).toBe(true);
		expect(() => cmd.getPlugin()).toThrow('Command dependencies not initialized');
	});

	it('should have default no-op onUnregister', () => {
		class MinimalCommand extends BaseCommand {
			readonly id = 'minimal';
			readonly name = 'Minimal';
			onRegister() {}
		}
		const cmd = new MinimalCommand();
		const plugin = createMockPlugin() as unknown as Plugin;
		cmd.register(createMockDeps(plugin));
		expect(() => cmd.unregister()).not.toThrow();
	});
});
