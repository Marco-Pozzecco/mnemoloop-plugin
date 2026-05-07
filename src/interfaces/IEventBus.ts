import type { IEvent } from './IEvent';

export type EventCallback = (event: IEvent) => void;

export interface IEventBus {
	subscribe(callback: EventCallback): EventCallback;
	unsubscribe(callback: EventCallback): void;
	publish(event: IEvent): string;
	request(event: IEvent, callback: EventCallback): void;
}
