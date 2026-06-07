import { IEvent } from './IEvent';

export interface IEventHandler {
	handle(event: IEvent): void | Promise<void>;
}
