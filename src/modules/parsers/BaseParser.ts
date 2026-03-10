import { IParser, ParseResult } from "@/interfaces/IParser";
import { IYamlEngine } from "@/interfaces/IYamlEngine";
import { Plugin } from "obsidian";

export abstract class BaseParser<Entity extends EntityMetadata, EntityMetadata> implements IParser<Entity, EntityMetadata> {
  protected _plugin: Plugin;
  protected _yaml: IYamlEngine<EntityMetadata>;

  constructor(plugin: Plugin, yamlEngine: IYamlEngine<EntityMetadata>) {
    this._plugin = plugin;
    this._yaml = yamlEngine;
  }

  abstract parse: (filepath: string, forceRefresh: boolean) => Promise<ParseResult<Entity>>;

  abstract parseAll: (dirPath: string, forceRefresh: boolean) => Promise<ParseResult<Entity>[]>;
}
