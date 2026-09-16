import z from 'zod';
import { PluginSettingsSchema } from './settings';
import { StatsSchema } from './statistics';

export const JsonDataSchema = z.object({
	version: z.number().int().nonnegative(),
	settings: PluginSettingsSchema,
	statistics: StatsSchema,
});

export type JsonData = z.infer<typeof JsonDataSchema>;
