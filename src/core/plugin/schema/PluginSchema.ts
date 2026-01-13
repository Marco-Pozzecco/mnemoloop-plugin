import { z } from 'zod';

export const PluginSettingsSchema = z.object({
  flashcardsDirectory: z.string().default('Flashcards/'),
  reviewIntervals: z.array(z.number().positive()).default([1, 3, 7, 14, 30]),
  baseEase: z.number().positive().default(2.5),
});
