import type { IAdapter } from '@/interfaces/IAdapter';
import { IEventEmitter } from '@/interfaces/IEventEmitter';
import { Logger } from '@/utils/Logger';
import { ZodError, ZodType } from 'zod';
import { AdapterAction } from '../events';

export abstract class BaseAdapter<T> implements IAdapter<T>, IEventEmitter<AdapterAction> {
	protected _data: T;
	protected _schema: ZodType<T>;

	constructor(
		protected defaultData: T,
		schema: ZodType<T>,
	) {
		this._data = defaultData;
		this._schema = schema;
	}

	abstract emit: (action: AdapterAction) => void;

	get data(): T {
		return this._data;
	}

	set: (data: T) => void = (data) => {
		this._data = this._schema.parse(data);
		this.emit(AdapterAction.Set);
	};

	setField: (field: keyof T, value: unknown) => void = (field, value) => {
		this.update({ [field]: value } as Partial<T>);
	};

	update: (data: Partial<T>) => void = (data) => {
		this.set({ ...this._data, ...data } as T);
		this.emit(AdapterAction.Update);
	};

	reset: () => Promise<void> = async () => {
		this.set(this.defaultData);
		this.emit(AdapterAction.Reset);
		await this.save();
	};

	initialize: () => Promise<void> = async () => {
		try {
			const storedData = await this.loadData();
			const result = this._schema.safeParse(storedData);

			if (result.success) {
				this._data = result.data;
			} else {
				this._data = this.recoverPartialData(storedData, result.error);
				await this.save();
			}
		} catch (error) {
			Logger.error(`adapter failed to load data, using defaults`, error);
			this._data = this.defaultData;
			await this.save();
		}
		this.emit(AdapterAction.Init);
	};

	save: () => Promise<void> = async () => {
		await this.saveData(this._data);
		this.emit(AdapterAction.Save);
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
			return recoveryResult.data;
		}

		return this.defaultData;
	}
}
