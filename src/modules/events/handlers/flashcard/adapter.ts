import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardAdapterGetRequestEvent,
	FlashcardAdapterGetResponseEvent,
	FlashcardAdapterInitEvent,
	FlashcardAdapterResetEvent,
	FlashcardAdapterSaveEvent,
	FlashcardAdapterSetRequestEvent,
	FlashcardAdapterSetResponseEvent,
	FlashcardAdapterStateEvent,
	FlashcardAdapterUpdateRequestEvent,
	FlashcardAdapterUpdateResponseEvent,
} from '../../domains';

export class FlashcardAdapterInitHandler extends EventHandler<FlashcardAdapterInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterInitEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.flashcard) as FlashcardAdapter;
		await adapter.initialize();
		// Publish the state change via the event bus
		void this._bus.publish(new FlashcardAdapterStateEvent(adapter.data));
	}
}

export class FlashcardAdapterResetHandler extends EventHandler<FlashcardAdapterResetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterResetEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.flashcard) as FlashcardAdapter;
		adapter.reset();
		// Publish the state change via the event bus
		void this._bus.publish(new FlashcardAdapterStateEvent(adapter.data));
	}
}

export class FlashcardAdapterSaveHandler extends EventHandler<FlashcardAdapterSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterSaveEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.flashcard) as FlashcardAdapter;
		await adapter.save();
		// Publish the state change via the event bus
		void this._bus.publish(new FlashcardAdapterStateEvent(adapter.data));
	}
}

export class FlashcardAdapterGetHandler extends EventHandler<FlashcardAdapterGetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterGetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.flashcard)! as FlashcardAdapter;
		void this._bus.publish(new FlashcardAdapterGetResponseEvent(adapter.data));
	}
}

export class FlashcardAdapterSetHandler extends EventHandler<FlashcardAdapterSetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardAdapterSetRequestEvent): Promise<void> {
		// Set the data on the adapter and save it
		const adapter = this._adapters.get(AdapterKey.flashcard)! as FlashcardAdapter;
		adapter.set(event.data);
		await adapter.save();
		// Publish the updated data via the event bus
		const updated = adapter.data;
		const response = new FlashcardAdapterSetResponseEvent(updated);
		void this._bus.publish(response);
		// Publish the state change via the event bus
		void this._bus.publish(new FlashcardAdapterStateEvent(updated));
	}
}

export class FlashcardAdapterUpdateHandler extends EventHandler<FlashcardAdapterUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardAdapterUpdateRequestEvent): Promise<void> {
		// Update the data on the adapter and save it
		const adapter = this._adapters.get(AdapterKey.flashcard)! as FlashcardAdapter;
		adapter.update(event.data);
		await adapter.save();
		// Publish the updated data via the event bus
		const updated = adapter.data;
		const response = new FlashcardAdapterUpdateResponseEvent(updated);
		void this._bus.publish(response);
		// Publish the state change via the event bus
		void this._bus.publish(new FlashcardAdapterStateEvent(updated));
	}
}
