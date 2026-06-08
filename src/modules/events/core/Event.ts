import { IEvent } from '@/interfaces/IEvent';
import { v4 as uuid } from 'uuid';

// Standard event base class
// Used for events that do not produce a response
export abstract class Event<TData> implements IEvent<TData> {
	static type: string;

	readonly id: string = uuid();
	readonly type: string;
	readonly time: Date;
	readonly data: TData;

	constructor(type: string, data: TData) {
		const ctor = this.constructor as typeof Event;
		ctor.type = type;
		this.type = type;
		this.time = new Date();
		this.data = data;
	}

	/** Check if this event matches a type */
	isType(type: string): boolean {
		return this.type === type;
	}

	/** Serialize to JSON-friendly format */
	toJSON() {
		return {
			type: this.type,
			timestamp: this.time.toISOString(),
			data: this.data,
		};
	}
}

// Event request base class
// Used as requests for events that produce a response
export abstract class EventRequest<TData> extends Event<TData> {
	constructor(type: string, data: TData) {
		type = `${type}:Request`;
		super(type, data);
	}
}

// Event response base class
// The response to an event request
export abstract class EventResponse<TData> extends Event<TData> {
	constructor(type: string, data: TData) {
		type = `${type}:Response`;
		super(type, data);
	}
}

/** Utility types */
export type EventDataOf<T> = T extends Event<infer D> ? D : never;
