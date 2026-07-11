export interface IWriter<Entity, EntityMetadata, TBody = Record<string, unknown>> {
	create: (filepath: string, entity: Entity) => Promise<void>;
	update: (filepath: string, entity: Partial<Entity>) => Promise<void>;
	updateFrontmatter: (filepath: string, data: Partial<EntityMetadata>) => Promise<void>;
	updateBody: (filepath: string, body: TBody) => Promise<void>;
	delete: (filepath: string) => Promise<void>;
}
