import { EventClass, EventHandlerClass } from '@/interfaces/IEventRegistry';
import { IEventRouter } from '@/interfaces/IEventRouter';

export class EventRouter implements IEventRouter {
	routes: Map<EventClass<unknown>, Set<EventHandlerClass>> = new Map();

	combine(...routers: IEventRouter[]): IEventRouter {
		for (const router of routers) {
			for (const [event, handlers] of router.routes) {
				if (!this.routes.has(event)) {
					this.routes.set(event, new Set());
				}
				for (const handler of handlers) {
					this.routes.get(event)!.add(handler);
				}
			}
		}
		return this;
	}

	route<T>(event: EventClass<T>, handler: EventHandlerClass): void {
		const e = event as unknown as EventClass<unknown>;
		if (!this.routes.has(e)) {
			this.routes.set(e, new Set());
		}
		this.routes.get(e)!.add(handler);
	}
}
