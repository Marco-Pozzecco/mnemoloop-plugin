import { IEvent } from './IEvent';

export interface IEventHandler<Event extends IEvent> {
	readonly eventTypes: string[];
	handle(event: Event): void | Promise<void>;
}
