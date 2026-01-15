import { SRSState } from '@/core/deprecated/types';
import { CardStatus } from '@/core/parser';
import { z } from 'zod';

export const SRSObjectSchema = z.object({
	stability: z.number().min(0),
	difficulty: z.number().min(0).max(10),
	state: z.enum(SRSState),
	last_review: z.iso.datetime().nullable(),
	next_review: z.iso.datetime(),
	reps: z.number().int().min(0),
});

export const CardMetadataSchema = z.object({
	uuid: z.uuid(),
	file: z.string().min(1),
	source: z.string().min(1),
	status: z.enum(CardStatus),
	created: z.iso.datetime(),
	updated: z.iso.datetime(),
	deleted_at: z.iso.datetime().nullable(),
	srs: SRSObjectSchema,
});

export const IndexSchema = z.object({
	version: z.number().int().positive(),
	last_updated: z.iso.datetime(),
	cards: z.record(z.string(), CardMetadataSchema),
});

export type SRSObject = z.infer<typeof SRSObjectSchema>;
export type CardMetadata = z.infer<typeof CardMetadataSchema>;
export type Index = z.infer<typeof IndexSchema>;
