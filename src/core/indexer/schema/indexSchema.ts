import { SRSState } from '@/core/types';
import { z } from 'zod';

export const SRSObjectSchema = z.object({
	stability: z.number().min(0),
	difficulty: z.number().min(0).max(10),
	state: z.enum(SRSState),
	last_review: z.string().datetime().nullable(),
	next_review: z.string().datetime(),
	reps: z.number().int().min(0),
});

export const CardMetadataSchema = z.object({
	file: z.string().min(1),
	source: z.string().min(1),
	status: z.enum(['ACTIVE', 'DELETED', 'PAUSED', 'STALE']),
	created: z.string().datetime(),
	updated: z.string().datetime(),
	deleted_at: z.string().datetime().nullable(),
	srs: SRSObjectSchema,
});

export const IndexSchema = z.object({
	version: z.number().int().positive(),
	cards: z.record(z.string(), CardMetadataSchema),
});

export type SRSObject = z.infer<typeof SRSObjectSchema>;
export type CardMetadata = z.infer<typeof CardMetadataSchema>;
export type Index = z.infer<typeof IndexSchema>;
