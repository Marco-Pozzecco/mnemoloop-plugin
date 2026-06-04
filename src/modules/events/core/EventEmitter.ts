import { IEvent } from '@/interfaces/IEvent';
import { IEventEmitter } from '@/interfaces/IEventEmitter';
import { EventBus } from './EventBus';

export class EventEmitter<Action> implements IEventEmitter<Action> {
	private _registry: Map<Action, Set<new (data: unknown) => IEvent>> = new Map();

	emit: (action: Action, data?: unknown) => void = (action, data) => {
		const events = this._registry.get(action);
		if (events) {
			events.forEach((EventClass) => {
				const event = new EventClass(data);
				EventBus.instance.publish(event);
			});
		}
	};

	subscribe<T>(action: Action, eventClass: new (data: T) => IEvent) {
		const events = this._registry.get(action);

		if (events) {
			events.add(eventClass as new (data: unknown) => IEvent);
		} else {
			this._registry.set(action, new Set([eventClass as new (data: unknown) => IEvent]));
		}
	}
}
