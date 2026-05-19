import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventRegistry } from '@/modules/events/core/EventRegistry';
import { EventProcessor } from '@/modules/events/core/EventProcessor';
import type { IEvent } from '@/interfaces/IEvent';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { Plugin } from 'obsidian';
import { resetSingletons } from '../../../../helpers/reset-singletons';

class TestProcessor extends EventProcessor {
	protected readonly eventTypes = ['test-event'];
	process(_event: IEvent): void {}
}

function createMockDeps(): IEventRegistryDependencies {
	return {
		plugin: {} as Plugin,
		adapters: new Map() as any,
		indexes: new Map() as any,
		parsers: new Map() as any,
	};
}

describe('EventRegistry', () => {
	beforeEach(() => {
		resetSingletons();
	});

	describe('register', () => {
		it('should register a processor factory', () => {
			const registry = EventRegistry.instance;
			registry.register('test', () => new TestProcessor());
			expect(registry.isRegistered('test')).toBe(true);
			expect(registry.registeredCount).toBe(1);
		});

		it('should throw on duplicate key registration', () => {
			const registry = EventRegistry.instance;
			registry.register('test', () => new TestProcessor());
			expect(() => registry.register('test', () => new TestProcessor())).toThrow(
				'EventProcessor with key "test" is already registered',
			);
		});
	});

	describe('initialize', () => {
		it('should instantiate processors from factories', () => {
			const registry = EventRegistry.instance;
			registry.register('test', () => new TestProcessor());
			registry.initialize(createMockDeps());
			expect(registry.isInitialized('test')).toBe(true);
			expect(registry.initializedCount).toBe(1);
		});

		it('should be idempotent (skip already initialized)', () => {
			const registry = EventRegistry.instance;
			const factory = vi.fn(() => new TestProcessor());
			registry.register('test', factory);
			const deps = createMockDeps();
			registry.initialize(deps);
			registry.initialize(deps);
			expect(factory).toHaveBeenCalledTimes(1);
		});

		it('should swallow factory errors without throwing', () => {
			const registry = EventRegistry.instance;
			registry.register('test', () => {
				throw new Error('factory fail');
			});
			const deps = createMockDeps();
			expect(() => registry.initialize(deps)).not.toThrow();
			expect(registry.isInitialized('test')).toBe(false);
		});
	});

	describe('dispose', () => {
		it('should dispose all processors and clear registry', () => {
			const registry = EventRegistry.instance;
			const processor = new TestProcessor();
			const disposeSpy = vi.spyOn(processor, 'dispose');
			registry.register('test', () => processor);
			registry.initialize(createMockDeps());
			registry.dispose();
			expect(disposeSpy).toHaveBeenCalled();
			expect(registry.registeredCount).toBe(0);
			expect(registry.initializedCount).toBe(0);
		});

		it('should swallow processor dispose errors', () => {
			const registry = EventRegistry.instance;
			const processor = new TestProcessor();
			vi.spyOn(processor, 'dispose').mockImplementation(() => {
				throw new Error('dispose fail');
			});
			registry.register('test', () => processor);
			registry.initialize(createMockDeps());
			expect(() => registry.dispose()).not.toThrow();
		});
	});

	describe('query methods', () => {
		it('should return registered and initialized keys', () => {
			const registry = EventRegistry.instance;
			registry.register('a', () => new TestProcessor());
			registry.register('b', () => new TestProcessor());
			registry.initialize(createMockDeps());
			expect(registry.registeredKeys).toEqual(['a', 'b']);
			expect(registry.initializedKeys).toEqual(['a', 'b']);
		});

		it('should get a processor by key', () => {
			const registry = EventRegistry.instance;
			const processor = new TestProcessor();
			registry.register('test', () => processor);
			registry.initialize(createMockDeps());
			expect(registry.getProcessor('test')).toBe(processor);
		});

		it('should return undefined for non-existent processor', () => {
			const registry = EventRegistry.instance;
			expect(registry.getProcessor('missing')).toBeUndefined();
		});

		it('should check hasProcessor for registered factories', () => {
			const registry = EventRegistry.instance;
			registry.register('test', () => new TestProcessor());
			expect(registry.hasProcessor('test')).toBe(true);
			expect(registry.isInitialized('test')).toBe(false);
		});
	});

	describe('unregister', () => {
		it('should dispose and remove an initialized processor', () => {
			const registry = EventRegistry.instance;
			const processor = new TestProcessor();
			const disposeSpy = vi.spyOn(processor, 'dispose');
			registry.register('test', () => processor);
			registry.initialize(createMockDeps());
			registry.unregister('test');
			expect(disposeSpy).toHaveBeenCalled();
			expect(registry.hasProcessor('test')).toBe(false);
		});

		it('should remove a registered but uninitialised factory', () => {
			const registry = EventRegistry.instance;
			registry.register('test', () => new TestProcessor());
			registry.unregister('test');
			expect(registry.hasProcessor('test')).toBe(false);
		});
	});
});
