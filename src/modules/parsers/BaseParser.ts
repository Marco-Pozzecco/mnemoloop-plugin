import { IParser, ParseResult } from '@/interfaces/IParser';
import { IYamlEngine } from '@/interfaces/IYamlEngine';
import { Plugin } from 'obsidian';

export abstract class BaseParser<Entity extends EntityMetadata, EntityMetadata> implements IParser<
	Entity,
	EntityMetadata
> {
	protected _plugin: Plugin;
	protected _yaml: IYamlEngine<EntityMetadata>;

	constructor(plugin: Plugin, yamlEngine: IYamlEngine<EntityMetadata>) {
		this._plugin = plugin;
		this._yaml = yamlEngine;
	}

	abstract marker: string;
	abstract parse: (filepath: string) => Promise<ParseResult<Entity>>;
	abstract parseContent: (content: string) => Omit<ParseResult<Entity>, 'filepath'>;
	abstract parseMetadata: (filepath: string) => Promise<ParseResult<EntityMetadata>>;
	abstract parseAll: (dirPath: string) => Promise<ParseResult<EntityMetadata>[]>;
}
