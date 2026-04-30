import { IEventRegistry, IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { IEventProcessor } from '@/interfaces/IEventProcessor';
import { Logger } from '@/utils/Logger';

/**
 * Singleton registry for managing EventProcessor lifecycle.
 *
 * - Registers processor factories (lazy instantiation)
 * - Initializes processors with dependencies when ready
 * - Provides dispose cleanup for all processors
 *
 * Pattern: Singleton with global access via EventRegistry.instance
 *
 * @example
 * ```typescript
 * // Register a processor factory:
 * EventRegistry.instance.register(ProcessorKey.statistics, (deps) => {
 *   return new StatisticsProcessor(deps.adapters.get(AdapterKey.statistics)!);
 * });
 *
 * // Initialize all registered processors:
 * EventRegistry.instance.initialize({ plugin, adapters, indexes, parsers });
 *
 * // Cleanup:
 * EventRegistry.instance.dispose();
 * ```
 */
export class EventRegistry implements IEventRegistry {
	private static _instance: EventRegistry;

	private _factories: Map<string, (deps: IEventRegistryDependencies) => IEventProcessor> =
		new Map();
	private _processors: Map<string, IEventProcessor> = new Map();

	private constructor() {}

	/**
	 * Get the singleton instance of EventRegistry.
	 */
	public static get instance(): EventRegistry {
		if (!EventRegistry._instance) {
			EventRegistry._instance = new EventRegistry();
		}
		return EventRegistry._instance;
	}

	/**
	 * Register a processor factory with a unique key.
	 * The factory receives dependencies and returns an IEventProcessor instance.
	 */
	public register<Key extends string>(
		key: Key,
		factory: (deps: IEventRegistryDependencies) => IEventProcessor,
	): void {
		if (this._factories.has(key)) {
			throw new Error(`EventProcessor with key "${key}" is already registered`);
		}
		this._factories.set(key, factory);
		Logger.debug(`EventRegistry: Registered processor factory "${key}"`);
	}

	/**
	 * Unregister a processor factory by key.
	 * If the processor is already initialized, it will be disposed first.
	 */
	public unregister<Key extends string>(key: Key): void {
		const processor = this._processors.get(key);
		if (processor) {
			processor.dispose();
			this._processors.delete(key);
		}
		this._factories.delete(key);
		Logger.debug(`EventRegistry: Unregistered processor "${key}"`);
	}

	/**
	 * Initialize all registered processors by calling their factories with dependencies.
	 */
	public initialize(deps: IEventRegistryDependencies): void {
		Logger.info('EventRegistry: Initializing processors');

		for (const [key, factory] of this._factories) {
			if (this._processors.has(key)) {
				Logger.debug(`EventRegistry: Processor "${key}" already initialized, skipping`);
				continue;
			}

			try {
				const processor = factory(deps);
				this._processors.set(key, processor);
				Logger.debug(`EventRegistry: Initialized processor "${key}"`);
			} catch (error) {
				Logger.error(`EventRegistry: Failed to initialize processor "${key}"`, error);
			}
		}

		Logger.info(`EventRegistry: Initialized ${this._processors.size} processor(s)`);
	}

	/**
	 * Dispose all initialized processors and clear the registry.
	 */
	public dispose(): void {
		Logger.info('EventRegistry: Disposing processors');

		for (const [key, processor] of this._processors) {
			try {
				processor.dispose();
				Logger.debug(`EventRegistry: Disposed processor "${key}"`);
			} catch (error) {
				Logger.error(`EventRegistry: Error disposing processor "${key}"`, error);
			}
		}

		this._processors.clear();
		this._factories.clear();

		Logger.info('EventRegistry: All processors disposed');
	}

	/**
	 * Get a processor by its key.
	 */
	public getProcessor<Key extends string>(key: Key): IEventProcessor | undefined {
		return this._processors.get(key);
	}

	/**
	 * Check if a processor is registered (factory) or initialized (instance).
	 */
	public hasProcessor(key: string): boolean {
		return this._factories.has(key) || this._processors.has(key);
	}

	/**
	 * Check if a processor factory is registered.
	 */
	public isRegistered(key: string): boolean {
		return this._factories.has(key);
	}

	/**
	 * Check if a processor is initialized (instance created).
	 */
	public isInitialized(key: string): boolean {
		return this._processors.has(key);
	}

	/**
	 * Get the count of registered processor factories.
	 */
	public get registeredCount(): number {
		return this._factories.size;
	}

	/**
	 * Get the count of initialized processors.
	 */
	public get initializedCount(): number {
		return this._processors.size;
	}

	/**
	 * Get all registered processor keys.
	 */
	public get registeredKeys(): string[] {
		return Array.from(this._factories.keys());
	}

	/**
	 * Get all initialized processor keys.
	 */
	public get initializedKeys(): string[] {
		return Array.from(this._processors.keys());
	}
}
