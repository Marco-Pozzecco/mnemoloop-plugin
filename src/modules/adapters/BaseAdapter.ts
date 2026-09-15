import type { IAdapter } from '@/interfaces/IAdapter';
import { Logger } from '@/utils/Logger';
import { ZodError, ZodType } from 'zod';
import { simpleClone } from '@/utils/Clone';

/** A value that can appear in parsed JSON. */
type StoredValue =
	string | number | boolean | null | undefined | StoredValue[] | { [key: string]: StoredValue };

export abstract class BaseAdapter<T> implements IAdapter<T> {
	protected _data: T;
	protected _schema: ZodType<T>;
	protected _initialized = false;

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

	get initialized(): boolean {
		return this._initialized;
	}

	set: (data: T) => void = (data) => {
		this._data = this._schema.parse(data);
	};

	setField: (field: keyof T, value: unknown) => void = (field, value) => {
		this.update({ [field]: value } as Partial<T>);
	};

	update: (data: Partial<T>) => void = (data) => {
		this._data = this._schema.parse({ ...this._data, ...data });
	};

	reset: () => void = () => {
		this._data = simpleClone(this.defaultData);
	};

	initialize: () => Promise<void> = async () => {
		try {
			const storedData = await this.loadData();

			// `null`/`undefined` means the entry is absent (first run): start from
			// cloned defaults and persist them so the storage file is seeded.
			if (storedData === null || storedData === undefined) {
				this._data = simpleClone(this.defaultData);
				await this.saveData(this._data);
				return;
			}

			const result = this._schema.safeParse(storedData);

			if (result.success) {
				this._data = result.data;
			} else {
				const { data, droppedPaths } = this.recoverPartialData(storedData, result.error);
				this._data = data;
				if (droppedPaths.length > 0) {
					Logger.warn(`adapter dropped invalid entries while recovering data`, droppedPaths);
				}
				await this.saveData(this._data);
			}
		} catch (error) {
			// A failed load must never overwrite the stored data: keep cloned
			// defaults in memory only and do not write during initialization.
			Logger.error(`adapter failed to load data, using defaults`, error);
			this._data = simpleClone(this.defaultData);
		} finally {
			this._initialized = true;
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
	protected getValueAtPath(obj: unknown, path: (string | number)[]): StoredValue {
		let current: StoredValue = obj as StoredValue;
		for (const key of path) {
			if (current === null || current === undefined) return undefined;
			if (typeof current !== 'object') return undefined;
			current = (current as Record<string | number, StoredValue>)[key];
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
			obj[String(path[0])] = value;
			return;
		}
		const [head, ...tail] = path;

		let next = obj[head];
		if (next === undefined || next === null || typeof next !== 'object') {
			if (tail[0] !== undefined && typeof tail[0] === 'number') {
				next = obj[head] = new Array(tail[0] + 1).fill(null);
			} else {
				next = obj[head] = {};
			}
		}
		this.setValueAtPath(next as Record<string, unknown>, tail, value);
	}

	/**
	 * Repairs data that parsed as JSON but failed schema validation by replacing
	 * invalid scalar fields with their defaults and dropping only the invalid
	 * elements of arrays/records (nearest ancestor with a default wins).
	 *
	 * Returns the repaired data together with the paths that were dropped. Throws
	 * when the repaired data still does not validate.
	 */
	private recoverPartialData(
		storedData: unknown,
		error: ZodError,
	): { data: T; droppedPaths: (string | number)[][] } {
		const partialData: Record<string, unknown> = {
			...(storedData as Record<string, unknown>),
		};

		const drops = new Map<string, (string | number)[]>();
		for (const issue of error.issues) {
			if (issue.path.length === 0) continue;

			const path = issue.path.filter((p): p is string | number => typeof p !== 'symbol');
			const defaultValue = this.getValueAtPath(this.defaultData, path);
			if (defaultValue !== undefined) {
				this.setValueAtPath(partialData, path, simpleClone(defaultValue));
				continue;
			}

			const dropPath = this.findDropPath(path);
			if (dropPath) {
				// Multiple issues can point inside the same element; drop it once.
				drops.set(JSON.stringify(dropPath), dropPath);
			}
		}

		const droppedPaths = [...drops.values()];
		this.applyDrops(partialData, droppedPaths);

		return { data: this._schema.parse(partialData), droppedPaths };
	}

	/**
	 * Walks up from an issue path to the nearest ancestor whose default exists and
	 * returns the path of the element to remove (the ancestor plus the next
	 * segment). Returns null when no ancestor provides a removable element.
	 */
	private findDropPath(path: (string | number)[]): (string | number)[] | null {
		for (let i = path.length - 1; i >= 0; i--) {
			const ancestor = path.slice(0, i);
			if (this.getValueAtPath(this.defaultData, ancestor) === undefined) continue;
			return path.slice(0, i + 1);
		}
		return null;
	}

	/**
	 * Removes the given paths from the repaired data. Array indices are removed
	 * from the highest index down so earlier removals do not shift the indices of
	 * the elements still to be dropped.
	 */
	private applyDrops(root: Record<string, unknown>, dropPaths: (string | number)[][]): void {
		const ordered = [...dropPaths].sort((a, b) => {
			const aParent = a.slice(0, -1).join('.');
			const bParent = b.slice(0, -1).join('.');
			if (aParent !== bParent) return aParent < bParent ? -1 : 1;
			const aKey = a[a.length - 1];
			const bKey = b[b.length - 1];
			if (typeof aKey === 'number' && typeof bKey === 'number') return bKey - aKey;
			return 0;
		});

		for (const dropPath of ordered) {
			const parentPath = dropPath.slice(0, -1);
			const key = dropPath[dropPath.length - 1];
			const parent = parentPath.length === 0 ? root : this.getValueAtPath(root, parentPath);
			if (parent === null || parent === undefined) continue;
			if (Array.isArray(parent) && typeof key === 'number') {
				parent.splice(key, 1);
			} else if (typeof parent === 'object') {
				delete (parent as Record<string | number, StoredValue>)[key];
			}
		}
	}
}
