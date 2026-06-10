import { IEventBus } from '@/interfaces/IEventBus';
import { IEventRegistry, IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { IEventRouter } from '@/interfaces/IEventRouter';
import { Logger } from '@/utils/Logger';

export class EventRegistry implements IEventRegistry {
	private _factories: Set<() => void> = new Set();
	private _unsubscribes: (() => void)[] = [];
	private _initialized = false;
	private _bus: IEventBus;
	private _deps: IEventRegistryDependencies;
	private _router: IEventRouter;

	constructor(bus: IEventBus, deps: IEventRegistryDependencies, router: IEventRouter) {
		this._bus = bus;
		this._deps = deps;
		this._router = router;
	}

	private _registerRouter(router: IEventRouter): void {
		// Register each event handler factory from the router's routes
		router.routes.forEach((handlers, event) => {
			// Register each handler for the given event
			handlers.forEach((handler) => {
				// Create a factory function that will create and subscribe the event handler
				const factory = () => {
					const eventHandler = new handler(this._deps);
					const unsubscribe = this._bus.subscribe(event, eventHandler.handle.bind(eventHandler));
					this._unsubscribes.push(unsubscribe);
				};
				// Add the factory to the set of factories to be initialized
				this._factories.add(factory);
			});
		});
	}

	initialize(): void {
		if (this._initialized) {
			return;
		}
		this._initialized = true;

		// Register the router and its routes
		this._registerRouter(this._router);

		Logger.info('n of registered handlers', this._factories.size);

		// Initialize each factory
		for (const factory of this._factories) {
			factory();
		}
	}

	dispose(): void {
		for (const unsubscribe of this._unsubscribes) {
			unsubscribe();
		}
		this._unsubscribes = [];
		this._factories.clear();
		this._initialized = false;
	}
}
