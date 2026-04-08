export interface IParser<Entity extends EntityYaml, EntityYaml> {
	parse: (filepath: string) => Promise<ParseResult<Entity>>;
	parseMetadata: (filepath: string) => Promise<ParseResult<EntityYaml>>;
	parseAll: (dirPath: string) => Promise<ParseResult<EntityYaml>[]>;
}

export type ParseResult<Entity> = ParseResultSuccess<Entity> | ParseResultError;

interface ParseResultSuccess<Entity> {
	success: true;
	entity: Entity;
	error: undefined;
}

interface ParseResultError {
	success: false;
	entity: undefined;
	error: string;
}
