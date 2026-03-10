import { IYamlEngine } from "@/interfaces/IYamlEngine";
import { FlashcardMetadata, FlashcardMetadataSchema } from "@/schemas";
import { BaseYamlEngine } from "./BaseYamlEngine";
import { Plugin } from "obsidian";

export class FlashcardYamlEngine extends BaseYamlEngine<FlashcardMetadata> implements IYamlEngine<FlashcardMetadata> {
  constructor(plugin: Plugin) {
    super(plugin, FlashcardMetadataSchema)
  }
}

