export interface IParser<Entity extends EntityYaml, EntityYaml> {
	parse: (filepath: string) => Promise<ParseResult<Entity>>;
	parseContent: (content: string) => Omit<ParseResult<Entity>, 'filepath'>;
	parseMetadata: (filepath: string) => Promise<ParseResult<EntityYaml>>;
	parseAll: (dirPath: string) => Promise<ParseResult<EntityYaml>[]>;
	readonly marker: string;
}

export type ParseResult<Entity> = {
	entity: Entity;
	filepath: string;
};
