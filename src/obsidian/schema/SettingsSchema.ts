import { z } from 'zod';

export const pluginSettingsSchema = z.object({
	flashcardsDirectory: z.string().min(1),
	watchDirectories: z.array(z.string().min(1)).min(1),
	watchTags: z.array(z.string().startsWith('#')),
	ignoredDirectories: z.array(z.string().min(1)),
	debounceTimeoutMs: z.number().min(100).max(5000),
	enableSoftDelete: z.boolean(),
	softDeleteHours: z.number().min(1).max(168),
	commandShortcuts: z.record(z.string(), z.string()),
});

export type PluginSettings = z.infer<typeof pluginSettingsSchema>;
