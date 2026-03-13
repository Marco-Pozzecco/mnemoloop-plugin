import { IYamlEngine } from "@/interfaces/IYamlEngine";
import { DEFAULT_FLASHCARD_METADATA, FlashcardMetadata, FlashcardMetadataSchema } from "@/schemas";
import { BaseYamlEngine } from "./BaseYamlEngine";
import { Plugin } from "obsidian";
import { v4 as uuid } from "uuid";

export class FlashcardYamlEngine extends BaseYamlEngine<FlashcardMetadata> implements IYamlEngine<FlashcardMetadata> {
  constructor(plugin: Plugin) {
    super(plugin, FlashcardMetadataSchema)
  }

  recover: (filepath: string) => Promise<void> = async (filepath) => {
    await this.write(filepath, this.generateDefaultYaml(filepath));
  };

  private generateDefaultYaml(filepath: string) {
    const yaml: FlashcardMetadata = {
      uuid: uuid(),
      file: filepath,
      ...DEFAULT_FLASHCARD_METADATA,
    }
    return yaml;
  }
}

