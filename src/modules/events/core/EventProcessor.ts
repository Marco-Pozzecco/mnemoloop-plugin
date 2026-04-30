import type { IEventProcessor } from '@/interfaces/IEventProcessor';
import { EventBus } from './EventBus';
import { IEvent } from '@/interfaces/IEvent';

export abstract class EventProcessor implements IEventProcessor {
	protected abstract readonly eventTypes: string[];
	private readonly _boundHandleEvent: (event: IEvent) => void;

	constructor() {
		this._boundHandleEvent = this._handleEvent.bind(this);
		EventBus.instance.subscribe(this._boundHandleEvent);
	}

	/**
	 * Unsubscribe from the EventBus and clean up resources.
	 */
	public dispose(): void {
		EventBus.instance.unsubscribe(this._boundHandleEvent);
	}

	/**
	 * Internal event handler that filters events before processing.
	 */
	private _handleEvent(event: IEvent): void {
		if (this.eventTypes.includes(event.type)) {
			this.process(event);
		}
	}

	/**
	 * Process an event. Subclasses implement their specific logic here.
	 *
	 * @param event The event to process (type-guaranteed by handleEvent filtering)
	 */
	protected abstract process(event: IEvent): void;
}
