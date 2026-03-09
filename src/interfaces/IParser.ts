import { Cache } from "@/utils/Cache";

export interface IParser<Entity extends EntityYaml, EntityYaml> {
  cache: Cache<Entity>;
  parse: (filepath: string, forceRefresh: boolean) => Promise<ParseResult<Entity>>
  parseAll: (dirPath: string, forceRefresh: boolean) => Promise<ParseResult<Entity>[]>
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
