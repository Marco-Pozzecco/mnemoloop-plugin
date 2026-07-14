export class Cache<Entity> {
	private cache: Map<string, Entity>;
	private dirty: boolean;

	constructor() {
		this.cache = new Map();
		this.dirty = false;
	}

	set(id: string, data: Entity): void {
		this.cache.set(id, data);
		this.dirty = true;
	}

	get(id: string): Entity | undefined {
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

	query(predicate: (entity: Entity) => boolean): Entity[] {
		return Array.from(this.cache.values()).filter(predicate);
	}

	getAll(): Entity[] {
		return Array.from(this.cache.values());
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

	load(entries: Record<string, Entity>): void {
		this.cache = new Map(Object.entries(entries));
		this.dirty = false;
	}

	dump(): Record<string, Entity> {
		return Object.fromEntries(this.cache);
	}
}
