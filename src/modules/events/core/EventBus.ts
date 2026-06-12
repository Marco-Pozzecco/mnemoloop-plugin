import { IEvent } from '@/interfaces/IEvent';
import { EventHandlerCallback, IEventBus } from '@/interfaces/IEventBus';
import { IEventHandler } from '@/interfaces/IEventHandler';
import { EventClass } from '@/interfaces/IEventRegistry';
import { Logger } from '@/utils/Logger';

export class EventBus implements IEventBus {
	private _registry: Map<string, Set<IEventHandler['handle']>> = new Map();
	private static _instance: EventBus | undefined;

	private constructor() {}

	static get instance(): EventBus {
		if (!EventBus._instance) {
			EventBus._instance = new EventBus();
		}
		return EventBus._instance;
	}

	async publish<TData>(event: IEvent<TData>): Promise<string> {
		Logger.debug(`Event: ${event.type}`, event);
		const handlers = this._registry.get(event.type);
		if (!handlers) {
			return event.id;
		}

		const promises = Array.from(handlers).map(async (h) => {
			try {
				return await h(event);
			} catch (err) {
				return Promise.reject(err instanceof Error ? err : new Error(String(err)));
			}
		});

		const results = await Promise.allSettled(promises);

		for (const result of results) {
			if (result.status === 'rejected') {
				Logger.error(`EventBus: error in handler for ${event.type}`, result.reason);
			}
		}

		return event.id;
	}

	subscribe<TData>(
		eventClass: EventClass<TData>,
		handler: EventHandlerCallback<TData>,
	): () => void {
		if (!eventClass.type)
			throw new Error(`EventClass must have a type: ${eventClass.constructor.name}`);
		if (!this._registry.has(eventClass.type)) {
			this._registry.set(eventClass.type, new Set());
		}
		const set = this._registry.get(eventClass.type)!;
		set.add(handler);

		return () => {
			this.unsubscribe(eventClass, handler);
		};
	}

	subscribeOnce<TData>(eventClass: EventClass<TData>, handler: EventHandlerCallback<TData>): void {
		if (!eventClass.type)
			throw new Error(`EventClass must have a type: ${eventClass.constructor.name}`);

		const onceHandler: EventHandlerCallback<TData> = (event) => {
			this.unsubscribe(eventClass, onceHandler);
			return handler(event);
		};

		this.subscribe(eventClass, onceHandler);
	}

	unsubscribe<TData>(eventClass: EventClass<TData>, handler: EventHandlerCallback<TData>): void {
		if (!eventClass.type)
			throw new Error(`EventClass must have a type: ${eventClass.constructor.name}`);
		const set = this._registry.get(eventClass.type);
		if (set) {
			set.delete(handler);
			if (set.size === 0) {
				this._registry.delete(eventClass.type);
			}
		}
	}
}
