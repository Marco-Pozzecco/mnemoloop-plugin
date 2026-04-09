export interface IYamlEngine<Entity> {
	encode(data: Entity): string;
	decode(yaml: string): Entity;
	extractFmFromFile(filepath: string): Promise<Entity>;
	extractFmFromCache(filepath: string): Entity;
	extractFmFromContent(content: string): { fm: Entity; body: string };
	write(filepath: string, data: Entity): Promise<void>;
	recover(filepath: string): Promise<void>;
	validate(data: Record<string, unknown>): Entity;
}
