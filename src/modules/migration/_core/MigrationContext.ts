import type { IDocumentStore } from '@/interfaces/migration/IDocumentStore';
import type { IMigrationContext } from '@/interfaces/migration/IMigrationContext';

/**
 * Buffered unit of work for a single migration run.
 *
 * Reads fall through to the store and are cached, so migrations observe their
 * own buffered writes and removals. `commit()` flushes every pending write
 * first and every pending removal afterwards, which guarantees that a
 * replacement document is on disk before the legacy document it supersedes is
 * deleted. A failed run simply never calls `commit()`, leaving the store
 * untouched.
 */
export class MigrationContext implements IMigrationContext {
	private readonly _cache = new Map<string, unknown>();
	private readonly _writes = new Map<string, unknown>();
	private readonly _removals = new Set<string>();

	constructor(private readonly _store: IDocumentStore) {}

	async read(name: string): Promise<unknown> {
		if (this._cache.has(name)) {
			return this._cache.get(name);
		}

		const data = await this._store.read(name);
		this._cache.set(name, data);
		return data;
	}

	write(name: string, data: unknown): void {
		this._removals.delete(name);
		this._writes.set(name, data);
		this._cache.set(name, data);
	}

	remove(name: string): void {
		this._writes.delete(name);
		this._removals.add(name);
		this._cache.set(name, undefined);
	}

	/** Flushes the buffered writes, then the buffered removals. */
	async commit(): Promise<void> {
		const writes = [...this._writes];
		const removals = [...this._removals];
		this._writes.clear();
		this._removals.clear();

		for (const [name, data] of writes) {
			await this._store.write(name, data);
		}

		for (const name of removals) {
			await this._store.remove(name);
		}
	}
}
