export interface PluginSettings {
  flashcardsDirectory: string;
  reviewIntervals: number[];
  baseEase: number;
}

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  flashcardsDirectory: 'Flashcards/',
  reviewIntervals: [1, 3, 7, 14, 30],
  baseEase: 2.5,
};
