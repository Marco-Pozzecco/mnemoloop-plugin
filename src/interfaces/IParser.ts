export interface IParser<Entity extends EntityYaml, EntityYaml> {
	parse: (filepath: string) => Promise<ParseResult<Entity>>;
	parseContent: (content: string) => ParseContentResult<Entity>;
	parseMetadata: (filepath: string) => Promise<ParseResult<EntityYaml>>;
	parseAll: (dirPath: string) => Promise<ParseResult<EntityYaml>[]>;
	readonly marker: string;
}

export type ParseResult<Entity> = ParseResultWithSuccess<Entity> | ParseResultWithError;
export type ParseContentResult<Entity> =
	| Omit<ParseResultWithSuccess<Entity>, 'filepath' | 'stats'>
	| Omit<ParseResultWithError, 'filepath' | 'stats'>;

type ParseResultWithSuccess<Entity> = {
	entity: Entity;
	stats: { created_at: string; updated_at: string };
	filepath: string;
	success: true;
};

type ParseResultWithError = {
	entity: null;
	stats: null;
	filepath: string;
	success: false;
	error: Error;
};
