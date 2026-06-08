import type { IAdapter } from '@/interfaces/IAdapter';
import { Logger } from '@/utils/Logger';
import { ZodError, ZodType } from 'zod';
import { simpleClone } from '@/utils/Clone';

export abstract class BaseAdapter<T> implements IAdapter<T> {
	protected _data: T;
	protected _schema: ZodType<T>;

	constructor(
		protected defaultData: T,
		schema: ZodType<T>,
	) {
		this._data = simpleClone(defaultData);
		this._schema = schema;
	}

	get data(): T {
		return this._data;
	}

	set: (data: T) => void = (data) => {
		this._data = this._schema.parse(data);
	};

	setField: (field: keyof T, value: unknown) => void = (field, value) => {
		this.update({ [field]: value } as Partial<T>);
	};

	update: (data: Partial<T>) => void = (data) => {
		this._data = this._schema.parse({ ...this._data, ...data } as T);
	};

	reset: () => Promise<void> = async () => {
		this._data = simpleClone(this.defaultData);
	};

	initialize: () => Promise<void> = async () => {
		try {
			const storedData = await this.loadData();
			const result = this._schema.safeParse(storedData);

			if (result.success) {
				this._data = result.data;
			} else {
				this._data = this.recoverPartialData(storedData, result.error);
				await this.saveData(this._data);
			}
		} catch (error) {
			Logger.error(`adapter failed to load data, using defaults`, error);
			this._data = this.defaultData;
			await this.saveData(this._data);
		}
	};

	save: () => Promise<void> = async () => {
		await this.saveData(this._data);
	};

	protected abstract loadData(): Promise<unknown>;
	protected abstract saveData(data: T): Promise<void>;

	/**
	 * Retrieves a value from a nested object using a path of keys/indices.
	 *
	 * @param obj The object to traverse
	 * @param path Array of keys/indices to follow
	 * @returns The value at the path, or undefined if path is invalid
	 */
	protected getValueAtPath(obj: unknown, path: (string | number)[]): unknown {
		let current: unknown = obj;
		for (const key of path) {
			if (current === null || current === undefined) return undefined;
			if (typeof current !== 'object') return undefined;
			current = (current as Record<string | number, unknown>)[key];
		}
		return current;
	}

	/**
	 * Sets a value at a nested path in an object, creating intermediate objects/arrays as needed.
	 *
	 * @param obj The root object to modify
	 * @param path Array of keys/indices describing the path
	 * @param value The value to set at the path
	 */
	protected setValueAtPath(
		obj: Record<string, unknown>,
		path: (string | number)[],
		value: unknown,
	): void {
		if (path.length === 0) return;
		if (path.length === 1) {
			obj[path[0]!] = value;
			return;
		}
		const [head, ...tail] = path;
		let next = obj[head!];
		if (next === undefined || next === null || typeof next !== 'object') {
			tail[0] !== undefined && typeof tail[0] === 'number'
				? (next = obj[head!] = new Array(tail[0] + 1).fill(null))
				: (next = obj[head!] = {});
		}
		this.setValueAtPath(next as Record<string, unknown>, tail, value);
	}

	private recoverPartialData(storedData: unknown, error: ZodError): T {
		const partialData: Record<string, unknown> = {};
		for (const issue of error.issues) {
			if (issue.path.length > 0) {
				const path = issue.path.filter((p): p is string | number => typeof p !== 'symbol');
				const value = this.getValueAtPath(storedData as Record<string, unknown>, path);
				if (value !== undefined) {
					this.setValueAtPath(partialData, path, value);
				}
			}
		}
		const merged = { ...this.defaultData, ...partialData };
		return this._schema.parse(merged);
	}
}
