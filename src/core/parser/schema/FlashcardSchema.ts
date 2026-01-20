import z from 'zod';
import { CardStatus } from '../utils/types';

export const FlashcardSchema = z
	.object({
		uuid: z.uuid(),
		file: z.string().min(1),
		source: z
			.string()
			.min(1)
			.regex(/^\[\[.*\]\]$/, 'Must be valid Obsidian link format'),
		status: z.enum(CardStatus),
		created: z.iso.datetime(),
		updated: z.iso.datetime(),
		deleted_at: z.iso.datetime().nullable(),
		front: z.string().min(0),
		back: z.string().min(0),
		srs: z.any(),
	})
	.refine(
		(data) => {
			const created = new Date(data.created).getTime();
			const updated = new Date(data.updated).getTime();
			return updated >= created;
		},
		{
			message: 'updated timestamp must be >= created timestamp',
		},
	);

export const FlashcardMetadataSchema = z.object({
	uuid: z.uuid(),
	file: z.string().min(1),
	source: z.string().min(1),
	status: z.enum(CardStatus),
	created: z.iso.datetime(),
	updated: z.iso.datetime(),
	deleted_at: z.iso.datetime().nullable(),
	srs: z.any(),
});
