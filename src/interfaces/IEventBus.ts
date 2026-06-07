import { IEvent } from './IEvent';

export type EventHandlerCallback<TData> = (event: IEvent<TData>) => void | Promise<void>;

export interface IEventBus {
	subscribe<TData>(eventType: string, handler: EventHandlerCallback<TData>): () => void;
	subscribeOnce<TData>(eventType: string, handler: EventHandlerCallback<TData>): void;
	unsubscribe<TData>(eventType: string, handler: EventHandlerCallback<TData>): void;
	publish<TData>(event: IEvent<TData>): string;
}
