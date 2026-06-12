export interface IParser<Entity extends EntityYaml, EntityYaml> {
	parse: (filepath: string) => Promise<ParseResult<Entity>>;
	parseContent: (content: string) => ParseContentResult<Entity>;
	parseMetadata: (filepath: string) => Promise<ParseResult<EntityYaml>>;
	parseAll: (dirPath: string) => Promise<ParseResult<EntityYaml>[]>;
	readonly marker: string;
}

export type ParseResult<Entity> = ParseResultWithSuccess<Entity> | ParseResultWithError;
export type ParseContentResult<Entity> =
	| Omit<ParseResultWithSuccess<Entity>, 'filepath'>
	| Omit<ParseResultWithError, 'filepath'>;

type ParseResultWithSuccess<Entity> = {
	entity: Entity;
	filepath: string;
	success: true;
};

type ParseResultWithError = {
	entity: null;
	filepath: string;
	success: false;
	error: Error;
};
