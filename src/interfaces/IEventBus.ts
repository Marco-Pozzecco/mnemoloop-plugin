import { IEvent } from './IEvent';
import type { EventClass } from './IEventRegistry';

export type EventHandlerCallback<TData> = (event: IEvent<TData>) => Promise<void>;

export interface IEventBus {
	subscribe<TData>(eventClass: EventClass<TData>, handler: EventHandlerCallback<TData>): () => void;
	subscribeOnce<TData>(eventClass: EventClass<TData>, handler: EventHandlerCallback<TData>): void;
	unsubscribe<TData>(eventClass: EventClass<TData>, handler: EventHandlerCallback<TData>): void;
	publish<TData>(event: IEvent<TData>): Promise<string>;
}
