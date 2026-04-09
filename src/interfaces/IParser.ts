export interface IParser<Entity extends EntityYaml, EntityYaml> {
	parse: (filepath: string) => Promise<ParseResult<Entity>>;
	parseMetadata: (filepath: string) => Promise<ParseResult<EntityYaml>>;
	parseAll: (dirPath: string) => Promise<ParseResult<EntityYaml>[]>;
}

export type ParseResult<Entity> = {
	entity: Entity;
	filepath: string;
};
