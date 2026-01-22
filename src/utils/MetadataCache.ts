import { FlashcardMetadata } from '../core/indexer/schema/IndexerSchema';

export class MetadataCache {
	private cache: Map<string, FlashcardMetadata>;
	private dirty: boolean;

	constructor() {
		this.cache = new Map();
		this.dirty = false;
	}

	set(id: string, data: FlashcardMetadata): void {
		this.cache.set(id, data);
		this.dirty = true;
	}

	get(id: string): FlashcardMetadata | undefined {
		return this.cache.get(id);
	}

	has(id: string): boolean {
		return this.cache.has(id);
	}

	delete(id: string): boolean {
		this.dirty = this.cache.delete(id) || this.dirty;
		return this.cache.has(id) === false;
	}

	clear(): void {
		this.cache.clear();
		this.dirty = true;
	}

	query(predicate: (card: FlashcardMetadata) => boolean): FlashcardMetadata[] {
		return Array.from(this.cache.values()).filter(predicate);
	}

	getAll(): Map<string, FlashcardMetadata> {
		return new Map(this.cache);
	}

	size(): number {
		return this.cache.size;
	}

	isDirty(): boolean {
		return this.dirty;
	}

	markClean(): void {
		this.dirty = false;
	}

	load(entries: Record<string, FlashcardMetadata>): void {
		this.cache = new Map(Object.entries(entries));
		this.dirty = false;
	}

	dump(): Record<string, FlashcardMetadata> {
		return Object.fromEntries(this.cache);
	}
}
