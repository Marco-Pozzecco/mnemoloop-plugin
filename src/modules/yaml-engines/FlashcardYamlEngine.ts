import { IYamlEngine } from "@/interfaces/IYamlEngine";
import { FlashcardMetadata, FlashcardMetadataSchema } from "@/schemas";
import { BaseYamlEngine } from "./BaseYamlEngine";
import { VaultAdapter } from "../obsidian";

export class FlashcardYamlEngine extends BaseYamlEngine<FlashcardMetadata> implements IYamlEngine<FlashcardMetadata> {
  constructor(vaultAdapter: VaultAdapter) {
    super(vaultAdapter, FlashcardMetadataSchema)
  }
}

