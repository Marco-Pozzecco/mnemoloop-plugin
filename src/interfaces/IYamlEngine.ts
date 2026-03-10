export interface IYamlEngine<Entity> {
  // methods
  extractFromFile: (filepath: string) => Promise<YamlParseResult<Entity>>;
  extractFromContent: (content: string) => YamlParseResult<Entity> & { content: string }
  write: (filepath: string, data: Entity) => Promise<void>;
  validate: (data: Record<string, unknown>) => Entity;
  removeFrontmatter: (content: string) => string;
}

export type YamlParseResult<Entity> = YamlParseResultSuccess<Entity> | YamlParseResultError;

interface YamlParseResultSuccess<Entity> {
  success: true;
  metadata: Entity;
  error: undefined;
}

interface YamlParseResultError {
  success: false;
  metadata: undefined;
  error: string;
}
