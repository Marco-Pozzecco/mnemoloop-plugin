import { IAdapter } from "@/interfaces/IAdapter";
import { Flashcard, Stats, PluginSettings } from "@/schemas";

export enum AdapterKey {
  statistics = "statistics",
  settings = "settings",
  flashcard = "flashcard",
}

interface AdapterMap {
  [AdapterKey.statistics]: IAdapter<Stats>;
  [AdapterKey.settings]: IAdapter<PluginSettings>;
  [AdapterKey.flashcard]: IAdapter<Flashcard>;
}

export type AdapterType<K extends AdapterKey = AdapterKey> = AdapterMap[K];

export type Adapters = Map<AdapterKey, AdapterType>;
