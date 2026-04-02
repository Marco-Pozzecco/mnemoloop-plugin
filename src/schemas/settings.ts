import { z } from 'zod';

// Watch configuration schema per entity
export const WatchConfigSchema = z.object({
	directory: z.string().min(1).startsWith('/'), // relative to vault root
	tags: z.array(z.string().startsWith('#')),
});

export const PluginSettingsSchema = z.object({
	flashcard: z.object({
		watch: WatchConfigSchema,
		marker: z.string().min(1),
	}),
	debounce_timeout_ms: z.number().min(100).max(5000),
	enable_soft_delete: z.boolean(),
	soft_delete_hours: z.number().min(1).max(168),
});

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
	flashcard: {
		marker: '?',
		watch: {
			directory: '/flashcards',
			tags: ['#flashcard'],
		},
	},
	debounce_timeout_ms: 500,
	enable_soft_delete: true,
	soft_delete_hours: 24,
};

export type PluginSettings = z.infer<typeof PluginSettingsSchema>;
export type WatchConfig = z.infer<typeof WatchConfigSchema>;
