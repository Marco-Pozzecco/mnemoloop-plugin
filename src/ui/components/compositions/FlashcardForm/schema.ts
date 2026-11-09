import { z } from 'zod';
import { CardStatus } from '@/schemas';

/**
 * The fields the form owns directly. Card content is validated by its editor
 * and registered through `contentApi`, because its state and rules live in the
 * per-type content components.
 */
export const FlashcardFormSchema = z.object({
	decks: z.array(z.string()),
	source: z.string().refine((value) => {
		const trimmed = value.trim();
		return trimmed === '' || /^\[\[.*\]\]$/.test(trimmed);
	}, 'Source must be a [[wikilink]] or empty.'),
	status: z.enum(CardStatus),
});

export type FlashcardFormValues = z.infer<typeof FlashcardFormSchema>;
