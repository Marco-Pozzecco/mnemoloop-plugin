import { ParseContentResult, ParseResult } from './utils';

export interface IEntityParser<
	Entity extends EntityYaml & { content: EntityContent },
	EntityYaml,
	EntityContent,
> {
	/** Parse a single flashcard file; returns merged entity (metadata + content). */
	parseFile: (filepath: string) => Promise<ParseResult<Entity>>;
	/** Parse all `.md` files in a directory, returning metadata only. */
	parseDir: (dirPath: string) => Promise<ParseResult<EntityYaml>[]>;
	/** Parse raw markdown content into an entity */
	parseEntity: (content: string) => ParseContentResult<Entity>;
	/** Parse raw markdown content string into a merged entity (no file stats). */
	parseContent: (content: string) => ParseContentResult<EntityContent>;
	/** Parse only the YAML frontmatter from a file  */
	parseYaml: (filepath: string) => Promise<ParseResult<EntityYaml>>;
	/** Parse YAML frontmatter from a cached file */
	parseYamlFromCache: (filepath: string) => ParseResult<EntityYaml>;
	/** Parse YAML frontmatter from a string */
	parseYamlFromContent: (content: string) => ParseContentResult<EntityYaml>;
	/** Serialize the entity structured data into a markdown string. */
	serializeEntity: (entity: Entity) => ParseContentResult<string>;
	/** Serialize the entity content into a string */
	serializeContent: (content: EntityContent) => ParseContentResult<string>;
	/** Serialize the entity yaml into a string */
	serializeYaml: (yaml: EntityYaml) => ParseContentResult<string>;
}
