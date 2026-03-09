import { FlashcardIndex, FlashcardIndexSchema } from "@/schemas";
import { BaseAdapter } from "./BaseAdapter";
import { Plugin, TFile } from "obsidian";
import { Logger } from "@/utils/Logger";

const DefaultData: FlashcardIndex = {
  flashcards: [],
  updated_at: null
}

export class FlashcardAdapter extends BaseAdapter<FlashcardIndex> {
  private _path: string;

  constructor(private plugin: Plugin) {
    super(DefaultData)
    const dir = this.plugin.manifest.dir
    this._path = `${dir}/flashcard-index.json`
  }

  initialize: () => Promise<void> = async () => {
    const file = this.plugin.app.vault.getAbstractFileByPath(this._path);
    if (file instanceof TFile) {
      const contentStr = await this.plugin.app.vault.read(file);
      const json = JSON.parse(contentStr);
      try {
        const index = this.validate(json);
        this.set(index);
      } catch (error) {
        Logger.warn("Index file is corrupted. Resetting...")
        this.save();
      }
    }
    await this.save();
  };

  save: () => Promise<void> = async () => {
    const file = this.plugin.app.vault.getAbstractFileByPath(this._path);
    if (file instanceof TFile) {
      await this.plugin.app.vault.modify(file, JSON.stringify(this._data));
    } else {
      await this.plugin.app.vault.create(this._path, JSON.stringify(this._data));
    }
  };

  protected validate(data: FlashcardIndex) {
    return FlashcardIndexSchema.parse(data);
  }
}
