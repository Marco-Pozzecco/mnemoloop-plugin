import { z } from 'zod';

export const PluginSettingsSchema = z.object({
  flashcardsDirectory: z.string().min(1),
  flashcardMarker: z.string().length(1),
  watchDirectories: z.array(z.string().min(1)).min(1),
  watchTags: z.array(z.string().startsWith('#')),
  ignoredDirectories: z.array(z.string().min(1)),
  debounceTimeoutMs: z.number().min(100).max(5000),
  enableSoftDelete: z.boolean(),
  softDeleteHours: z.number().min(1).max(168),
});

export const DEFAULT_PLUGIN_SETTINGS = PluginSettingsSchema.parse({
  flashcardsDirectory: 'flashcards',
  flashcardMarker: "?",
  watchDirectories: ['/'],
  watchTags: ['#flashcard'],
  ignoredDirectories: ['trash'],
  debounceTimeoutMs: 500,
  enableSoftDelete: true,
  softDeleteHours: 24,
});

export type PluginSettings = z.infer<typeof PluginSettingsSchema>;
