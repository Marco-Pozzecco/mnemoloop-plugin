import type { IAdapter } from '@/interfaces/IAdapter';
import { AdapterDataKey, AdapterEventsKeys, AdapterEventsOf } from '@/types/adapters';
import { Logger } from '@/utils/Logger';
import { ZodError, ZodType } from 'zod';
import { EventBus } from '../event-bus/EventBus';

export abstract class BaseAdapter<T, K extends keyof AdapterEventsKeys> implements IAdapter<T> {
	protected _data: T;
	protected _schema: ZodType<T>;

	constructor(
		protected defaultData: T,
		protected _eventTypes: AdapterEventsOf<K>,
		protected _dataKey: AdapterDataKey,
		schema: ZodType<T>,
	) {
		this._data = defaultData;
		this._schema = schema;
	}

	get data(): T {
		return this._data;
	}

	set: (data: T) => void = (data) => {
		this._data = this._schema.parse(data);

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

	initialize: () => Promise<void> = async () => {
		try {
			const storedData = await this.loadData();
			const result = this._schema.safeParse(storedData);

			if (result.success) {
				this._data = result.data;
				Logger.info(`${this._dataKey} adapter initialized successfully`);
			} else {
				Logger.warn(
					`${this._dataKey} adapter validation failed, attempting partial recovery`,
					result.error.issues,
				);
				this._data = this.recoverPartialData(storedData, result.error);
				await this.save();
			}
		} catch (error) {
			Logger.error(`${this._dataKey} adapter failed to load data, using defaults`, error);
			this._data = this.defaultData;
			await this.save();
		}

		const event = {
			event_type: this._eventTypes.init,
			created_at: new Date(),
			data: {
				[this._dataKey]: this._data,
			},
		};
		EventBus.instance.publish(event);
	};

	save: () => Promise<void> = async () => {
		await this.saveData(this._data);

		const event = {
			event_type: this._eventTypes.save,
			created_at: new Date(),
			data: {
				[this._dataKey]: this._data,
				saved_at: new Date(),
			},
		};
		EventBus.instance.publish(event);
	};

	protected abstract loadData(): Promise<unknown>;
	protected abstract saveData(data: T): Promise<void>;

	/**
	 * Retrieves a value from a nested object using a path of keys/indices.
	 * @param obj - The object to traverse
	 * @param path - Array of property keys or array indices
	 * @returns The value at the specified path, or undefined if path doesn't exist
	 */
	protected getValueAtPath(obj: unknown, path: (string | number)[]): unknown {
		let current: unknown = obj;
		for (const key of path) {
			if (current === null || current === undefined) {
				return undefined;
			}
			if (typeof current === 'object') {
				current = (current as Record<string | number, unknown>)[key];
			} else {
				return undefined;
			}
		}
		return current;
	}

	/**
	 * Sets a value at a nested path in an object, creating intermediate objects/arrays as needed.
	 * @param obj - The object to modify
	 * @param path - Array of property keys or array indices
	 * @param value - The value to set at the specified path
	 */
	protected setValueAtPath(
		obj: Record<string, unknown>,
		path: (string | number)[],
		value: unknown,
	): void {
		let current: Record<string | number, unknown> = obj;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			const nextKey = path[i + 1];
			if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
				current[key] = typeof nextKey === 'number' ? [] : {};
			}
			current = current[key] as Record<string | number, unknown>;
		}
		const lastKey = path[path.length - 1];
		current[lastKey] = value;
	}

	private recoverPartialData(storedData: unknown, error: ZodError): T {
		// If storedData is null, undefined, or not an object, can't do partial recovery
		if (storedData === null || storedData === undefined || typeof storedData !== 'object') {
			Logger.warn(
				`${this._dataKey} adapter data is ${storedData === null ? 'null' : storedData === undefined ? 'undefined' : 'not an object'}, using full defaults`,
			);
			return this.defaultData;
		}

		const clonedData = Object.assign({}, storedData) as Record<string, unknown>;

		for (const issue of error.issues) {
			const path = issue.path.filter((p): p is string | number => typeof p !== 'symbol');
			const defaultValue = this.getValueAtPath(this.defaultData, path);
			this.setValueAtPath(clonedData, path, defaultValue);
		}

		const recoveryResult = this._schema.safeParse(clonedData);
		if (recoveryResult.success) {
			Logger.info(`${this._dataKey} adapter partial recovery successful`);
			return recoveryResult.data;
		}

		Logger.error(
			`${this._dataKey} adapter partial recovery failed, using full defaults`,
			recoveryResult.error.issues,
		);
		return this.defaultData;
	}
}
