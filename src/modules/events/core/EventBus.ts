import { IEvent } from '@/interfaces/IEvent';
import type { IEventBus } from '@/interfaces/IEventBus';
import { Logger } from '@/utils/Logger';

/**
 * Central event bus using singleton pattern
 */
export class EventBus implements IEventBus {
	private static _instance: EventBus;
	private _subscribers: Set<(event: IEvent) => void>;

	private constructor() {
		this._subscribers = new Set();
	}

	public static get instance(): EventBus {
		if (!EventBus._instance) {
			EventBus._instance = new EventBus();
		}
		return EventBus._instance;
	}

	public subscribe(callback: (event: IEvent) => void): void {
		this._subscribers.add(callback);
	}

	public unsubscribe(callback: (event: IEvent) => void): void {
		this._subscribers.delete(callback);
	}

	public publish(event: IEvent): void {
		Logger.debug('Event:', event.type, 'Data:', event.data);
		this._subscribers.forEach((callback) => {
			callback(event);
		});
	}
}
