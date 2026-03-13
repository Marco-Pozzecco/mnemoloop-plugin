import { Flashcard, FlashcardIndex, FlashcardMetadata } from "@/schemas";
import { BaseIndexer } from "./BaseIndexer";
import { FlashcardParser } from "../parsers/FlashcardParser";
import { IAdapter } from "@/interfaces/IAdapter";
import { PluginSettings } from "@/schemas/settings";
import { FlashcardAdapter } from "../adapters/FlashcardAdapter";
import { Plugin } from "obsidian";
import { Logger } from "@/utils/Logger";

export class FlascardIndexer extends BaseIndexer<Flashcard, FlashcardMetadata, FlashcardIndex> {
  private _dirPath = this._settings.data.flashcardsDirectory;

  constructor(plugin: Plugin, settings: IAdapter<PluginSettings>) {
    const parser = new FlashcardParser(plugin, settings);
    const adapter = new FlashcardAdapter(plugin);
    super(parser, settings, adapter)
  }

  initialize: () => Promise<void> = async () => {
    Logger.info("initialize flashcards index...")
    await this._adapter.initialize();

    const { flashcards } = this._adapter.data;

    if (flashcards.length === 0) {
      await this.reindex();
    } else {
      for (const flashcard of flashcards) {
        this._cache.set(flashcard.uuid, flashcard);
      }
    }

    await this.save();
    Logger.info('flashcards index initialization complete')
  };

  save: () => Promise<void> = async () => {
    const flashcards = Object.values(this._cache.dump());

    this._adapter.set({
      flashcards, updated_at: new Date().toISOString()
    });

    await this._adapter.save();
  };

  reindex: () => Promise<void> = async () => {
    Logger.info("reindexing flashcards...")
    const flashcards = await this._parser.parseAll(this._dirPath, false);

    for (const flashcard of flashcards) {
      if (!flashcard.entity) {
        continue
      }
      this.upsert(flashcard.entity.uuid, flashcard.entity);
    }
  }
} 
