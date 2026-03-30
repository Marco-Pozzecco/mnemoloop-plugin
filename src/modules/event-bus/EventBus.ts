import { EventData } from '@/types/events';
import { IEventBus } from '@/interfaces/IEventBus';
import { Logger } from '@/utils/Logger';

export class EventBus implements IEventBus {
	private static _instance: EventBus;
	private _subscribers: Set<(event: EventData<unknown>) => void>;

	private constructor() {
		this._subscribers = new Set();
	}

	public static get instance(): EventBus {
		if (!EventBus._instance) {
			EventBus._instance = new EventBus();
		}
		return EventBus._instance;
	}

	public subscribe(callback: (event: EventData<unknown>) => void): void {
		this._subscribers.add(callback);
	}

	public unsubscribe(callback: (event: EventData<unknown>) => void): void {
		this._subscribers.delete(callback);
	}

	public publish(event: EventData<unknown>): void {
		Logger.debug('Event fired:', event.event_type, event.data);
		this._subscribers.forEach((callback) => {
			callback(event);
		});
	}
}
