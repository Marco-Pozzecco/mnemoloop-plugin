export interface IIndexer<EntityMetadata> {
	readonly index: Record<string, EntityMetadata>;

	initialize: () => Promise<void>;
	save: () => Promise<void>;

	get: (id: string) => EntityMetadata | undefined;
	getAll: () => EntityMetadata[];
	query: (predicate: (entity: EntityMetadata) => boolean) => EntityMetadata[];
	create: (id: string, data: EntityMetadata) => EntityMetadata;
	update: (id: string, data: Partial<EntityMetadata>) => EntityMetadata;
	upsert: (id: string, data: EntityMetadata) => EntityMetadata;
	delete: (id: string) => void;
}
