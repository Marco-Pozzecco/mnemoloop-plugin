import { z } from 'zod';
import { SyncSource, CardStatus } from '../utils/types';

export const SyncStateSchema = z.object({
	uuid: z.uuid(),
	source: z.enum(SyncSource),
	timestamp: z.iso.datetime(),
	changes: z.record(z.string(), z.any()),
	conflict: z.boolean(),
});

export const SyncResultSchema = z.object({
	success: z.boolean(),
	conflicts_resolved: z.number().int().nonnegative(),
	errors: z.array(z.string()),
});

export const SyncConflictSchema = z.object({
	field: z.string(),
	json_value: z.any(),
	yaml_value: z.any(),
	last_write: z.enum(['json', 'yaml']),
	resolved_value: z.any(),
});

export const IndexRecoveryResultSchema = z.object({
	success: z.boolean(),
	cards_recovered: z.number().int().nonnegative(),
	cards_failed: z.number().int().nonnegative(),
	errors: z.array(
		z.object({
			file: z.string(),
			error: z.string(),
		}),
	),
	duration_ms: z.number().nonnegative(),
});

export const IndexSchema = z.object({
	version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semver format'),
	last_updated: z.iso.datetime(),
	cards: z.record(
		z.uuid(),
		z.object({
			uuid: z.uuid(),
			file: z.string().min(1),
			source: z.string().min(1),
			status: z.enum(CardStatus),
			created: z.iso.datetime(),
			updated: z.iso.datetime(),
			deleted_at: z.iso.datetime().nullable(),
			srs: z.any(),
		}),
	),
});
