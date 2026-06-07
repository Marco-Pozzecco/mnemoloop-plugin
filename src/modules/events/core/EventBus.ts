import { IEvent } from '@/interfaces/IEvent';
import { EventHandlerCallback, IEventBus } from '@/interfaces/IEventBus';
import { IEventHandler } from '@/interfaces/IEventHandler';
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

	publish<TData>(event: IEvent<TData>): string {
		const handlers = this._registry.get(event.type);
		if (!handlers) {
			return event.id;
		}

		for (const handler of handlers) {
			try {
				handler(event as IEvent<unknown>);
			} catch (err) {
				Logger.error(`EventBus: error in handler for ${event.type}`, err);
			}
		}

		return event.id;
	}

	subscribe<TData>(eventType: string, handler: EventHandlerCallback<TData>): () => void {
		if (!this._registry.has(eventType)) {
			this._registry.set(eventType, new Set());
		}
		const set = this._registry.get(eventType)!;
		set.add(handler);

		return () => {
			this.unsubscribe(eventType, handler);
		};
	}

	subscribeOnce<TData>(eventType: string, handler: EventHandlerCallback<TData>): void {
		const onceHandler: EventHandlerCallback<TData> = (event) => {
			this.unsubscribe(eventType, onceHandler);
			return handler(event);
		};

		this.subscribe(eventType, onceHandler);
	}

	unsubscribe<TData>(eventType: string, handler: EventHandlerCallback<TData>): void {
		const set = this._registry.get(eventType);
		if (set) {
			set.delete(handler);
			if (set.size === 0) {
				this._registry.delete(eventType);
			}
		}
	}
}
