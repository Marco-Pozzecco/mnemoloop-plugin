import type { IDocumentStore } from '@/interfaces/migration/IDocumentStore';

/**
 * In-memory `IDocumentStore` double for migration tests.
 *
 * `documents` exposes the current content, while `operations` records the I/O
 * calls in order (`write:<name>` / `remove:<name>`) so tests can assert commit
 * ordering.
 */
export class MemoryDocumentStore implements IDocumentStore {
	private readonly _documents = new Map<string, unknown>();

	/** Recorded I/O calls, in order, as `write:<name>` or `remove:<name>`. */
	readonly operations: string[] = [];

	constructor(initial: Record<string, unknown> = {}) {
		for (const [name, data] of Object.entries(initial)) {
			this._documents.set(name, data);
		}
	}

	/** Current document content, keyed by document name. */
	get documents(): ReadonlyMap<string, unknown> {
		return this._documents;
	}

	has(name: string): boolean {
		return this._documents.has(name);
	}

	get(name: string): unknown {
		return this._documents.get(name);
	}

	async read(name: string): Promise<unknown> {
		return this._documents.get(name);
	}

	async write(name: string, data: unknown): Promise<void> {
		this._documents.set(name, data);
		this.operations.push(`write:${name}`);
	}

	async remove(name: string): Promise<void> {
		this._documents.delete(name);
		this.operations.push(`remove:${name}`);
	}
}
