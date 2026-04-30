import type { IEvent } from './IEvent';

export interface IEventBus {
	subscribe(callback: (event: IEvent) => void): void;
	unsubscribe(callback: (event: IEvent) => void): void;
	publish(event: IEvent): void;
}
