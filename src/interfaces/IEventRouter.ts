import { EventClass, EventHandlerClass } from './IEventRegistry';

export interface IEventRouter {
	readonly routes: Map<EventClass<unknown>, Set<EventHandlerClass>>;
	combine(...routers: IEventRouter[]): IEventRouter;
	route<T>(event: EventClass<T>, handler: EventHandlerClass): void;
}
