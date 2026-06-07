import { IEventBus } from '@/interfaces/IEventBus';
import {
	EventClass,
	EventHandlerClass,
	IEventRegistry,
	IEventRegistryDependencies,
} from '@/interfaces/IEventRegistry';
import { EventBus } from './EventBus';

export class EventRegistry implements IEventRegistry {
	private _factories: Set<() => void> = new Set();
	private _unsubscribes: (() => void)[] = [];
	private _isInitialized: boolean = false;
	private _bus: IEventBus;
	private _deps: IEventRegistryDependencies | null = null;
	private static _instance: EventRegistry | null = null;

	private constructor(bus: IEventBus = EventBus.instance) {
		this._bus = bus;
	}

	static get instance(): EventRegistry {
		if (!this._instance) {
			this._instance = new EventRegistry();
		}
		return this._instance;
	}

	register(Event: EventClass, Handler: EventHandlerClass): void {
		const factory = () => {
			if (!this._deps) throw new Error('EventRegistry is not initialized');
			const handler = new Handler(this._deps);
			const unsubscribe = this._bus.subscribe(Event.type, handler.handle);
			this._unsubscribes.push(unsubscribe);
		};

		this._factories.add(factory);

		if (this._isInitialized) {
			factory();
		}
	}

	initialize(deps: IEventRegistryDependencies): void {
		this._deps = deps;

		for (const factory of this._factories) {
			factory();
		}

		this._isInitialized = true;
	}

	dispose(): void {
		for (const unsubscribe of this._unsubscribes) {
			unsubscribe();
		}
		this._unsubscribes = [];
		this._factories.clear();
		this._isInitialized = false;
	}
}
