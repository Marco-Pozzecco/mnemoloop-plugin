import z from 'zod';
import { PluginSettingsSchema } from './settings';
import { StatsSchema } from './statistics';

export const JsonDataSchema = z.object({
	settings: PluginSettingsSchema,
	statistics: StatsSchema,
});

export type JsonData = z.infer<typeof JsonDataSchema>;
