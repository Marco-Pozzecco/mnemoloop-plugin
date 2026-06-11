import { z } from 'zod';

// Watch configuration schema per entity

const StepUnitSchema = z.string().regex(/^\d+[mhd]$/);

export const WatchConfigSchema = z.object({
	directory: z.string().min(1).startsWith('/'), // relative to vault root
	tags: z.array(z.string().startsWith('#')),
});

export const FsrsConfigSchema = z.object({
	request_retention: z.number().min(0).max(1),
	maximum_interval: z.number().min(1),
	enable_fuzz: z.boolean(),
	enable_short_term: z.boolean(),
	learning_steps: z.array(StepUnitSchema).min(1),
	relearning_steps: z.array(StepUnitSchema).min(1),
});

export const PluginSettingsSchema = z.object({
	flashcard: z.object({
		watch: WatchConfigSchema,
		marker: z.string().min(1),
		fsrs: FsrsConfigSchema,
	}),
	debounce_timeout_ms: z.number().min(100).max(5000),
	enable_soft_delete: z.boolean(),
	soft_delete_hours: z.number().min(1).max(168),
});


export const DEFAULT_FSRS_CONFIG: FsrsConfig = {
	request_retention: 0.9,
	maximum_interval: 36500,
	enable_fuzz: false,
	enable_short_term: true,
	learning_steps: ['1m', '10m'],
	relearning_steps: ['10m'],
};

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
	flashcard: {
		marker: '?',
		watch: {
			directory: '/flashcards',
			tags: ['#flashcard'],
		},
		fsrs: DEFAULT_FSRS_CONFIG,
	},
	debounce_timeout_ms: 500,
	enable_soft_delete: true,
	soft_delete_hours: 24,
};

export type PluginSettings = z.infer<typeof PluginSettingsSchema>;
export type WatchConfig = z.infer<typeof WatchConfigSchema>;
export type FsrsConfig = z.infer<typeof FsrsConfigSchema>;
export const RETENTION_PERIOD_OPTIONS = [
	{ value: 1, label: '1 hour' },
	{ value: 6, label: '6 hours' },
	{ value: 12, label: '12 hours' },
	{ value: 24, label: '24 hours' },
	{ value: 48, label: '48 hours' },
	{ value: 168, label: '7 days' },
] as const;

export type RetentionPeriod = (typeof RETENTION_PERIOD_OPTIONS)[number]['value'];
