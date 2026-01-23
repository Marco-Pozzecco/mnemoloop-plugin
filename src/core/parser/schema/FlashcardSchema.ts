import { FlashcardMetadataSchema } from '../../indexer/schema/IndexerSchema';
import { z } from 'zod';

export const FlashcardSchema = FlashcardMetadataSchema.extend({
	front: z.string().min(0),
	back: z.string().min(0),
}).refine(
	(data) => {
		const created = new Date(data.created_at).getTime();
		const updated = new Date(data.updated_at).getTime();
		return updated >= created;
	},
	{
		message: 'updated timestamp must be >= created timestamp',
	},
);
