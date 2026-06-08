import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardAdapterInitEvent,
	FlashcardAdapterResetEvent,
	FlashcardAdapterSaveEvent,
	FlashcardAdapterSetRequestEvent,
	FlashcardAdapterSetResponseEvent,
	FlashcardAdapterUpdateRequestEvent,
	FlashcardAdapterUpdateResponseEvent,
} from '../../domains';

export class FlashcardAdapterInitHandler extends EventHandler<FlashcardAdapterInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterInitEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.flashcard)!;
		await adapter.initialize();
	}
}

export class FlashcardAdapterResetHandler extends EventHandler<FlashcardAdapterResetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterResetEvent): Promise<void> {
		await this._adapters.get(AdapterKey.flashcard)!.reset();
	}
}

export class FlashcardAdapterSaveHandler extends EventHandler<FlashcardAdapterSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardAdapterSaveEvent): Promise<void> {
		await this._adapters.get(AdapterKey.flashcard)!.save();
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
		this._bus.publish(response);
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
		this._bus.publish(response);
	}
}
