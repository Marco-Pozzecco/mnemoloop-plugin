import { IEvent } from './IEvent';
import { IEventHandler } from './IEventHandler';

export interface IEventBus {
	subscribe<TData extends IEvent>(handler: IEventHandler<TData>): () => void;
	subscribeOnce<TData extends IEvent>(handler: IEventHandler<TData>): () => void;
	unsubscribe<TData extends IEvent>(handler: IEventHandler<TData>): void;
	publish<TData>(event: IEvent<TData>): string;
}
