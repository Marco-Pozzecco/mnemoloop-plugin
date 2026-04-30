import { IEvent } from '@/interfaces/IEvent';
import { v4 as uuid } from 'uuid';

export abstract class Event<TData> implements IEvent<TData> {
	readonly id: string = uuid();
	readonly type: string;
	readonly time: Date;
	readonly data: TData;

	constructor(type: string, data: TData) {
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

/** Utility types */
export type EventDataOf<T> = T extends Event<infer D> ? D : never;
