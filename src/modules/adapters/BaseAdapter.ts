import type { IAdapter } from '@/interfaces/IAdapter';
import { EventBus } from '../event-bus/EventBus';
import { AdapterDataKey, AdapterEventsKeys, AdapterEventsOf } from '@/types/adapters';

export abstract class BaseAdapter<T, K extends keyof AdapterEventsKeys> implements IAdapter<T> {
	protected _data: T;

	constructor(
		protected defaultData: T,
		protected _eventTypes: AdapterEventsOf<K>,
		protected _dataKey: AdapterDataKey,
	) {
		this._data = defaultData;
	}

	get data(): T {
		return this._data;
	}

	set: (data: T) => void = (data) => {
		this._data = this.validate(data);

		const event = {
			event_type: this._eventTypes.set,
			created_at: new Date(),
			data: {
				[this._dataKey]: this._data,
			},
		};
		EventBus.instance.publish(event);
	};

	setField: (field: keyof T, value: unknown) => void = (field, value) => {
		this.update({ [field]: value } as Partial<T>);
	};

	update: (data: Partial<T>) => void = (data) => {
		this.set({ ...this._data, ...data } as T);

		const event = {
			event_type: this._eventTypes.update,
			created_at: new Date(),
			data: {
				[this._dataKey]: this._data,
			},
		};
		EventBus.instance.publish(event);
	};

	reset: () => Promise<void> = async () => {
		this.set(this.defaultData);
		await this.save();

		const event = {
			event_type: this._eventTypes.reset,
			created_at: new Date(),
			data: {
				[this._dataKey]: this._data,
			},
		};
		EventBus.instance.publish(event);
	};

	abstract initialize: () => Promise<void>;
	abstract save: () => Promise<void>;

	protected validate(data: T): T {
		return data;
	}
}
