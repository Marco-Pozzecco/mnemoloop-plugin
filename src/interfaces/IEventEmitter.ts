import { IEvent } from './IEvent';

export interface IEventEmitter<T> {
	emit: (action: T, data?: unknown) => void;
	subscribe: (action: T, eventClass: new (...args: unknown[]) => IEvent) => void;
}
