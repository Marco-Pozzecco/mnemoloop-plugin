import { IParser, ParseResult } from "@/interfaces/IParser";
import { VaultAdapter } from "../obsidian";
import { IYamlEngine } from "@/interfaces/IYamlEngine";
import { Cache } from "@/utils/Cache";

export abstract class BaseParser<Entity extends EntityMetadata, EntityMetadata> implements IParser<Entity, EntityMetadata> {
  cache: Cache<Entity> = new Cache();
  protected vaultAdapter: VaultAdapter;
  protected yaml: IYamlEngine<EntityMetadata>;

  constructor(vaultAdapter: VaultAdapter, yamlEngine: IYamlEngine<EntityMetadata>) {
    this.vaultAdapter = vaultAdapter;
    this.yaml = yamlEngine;
  }


  abstract parse: (filepath: string, forceRefresh: boolean) => Promise<ParseResult<Entity>>;
}
