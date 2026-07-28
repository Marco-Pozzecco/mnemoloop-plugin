import { z } from 'zod';
import { DEFAULT_FSRS } from '@/utils/constants';
import {
	CardType,
	CardStatus,
	CardTypeSchema,
	DEFAULT_FLASHCARD_YAML,
	FlashcardYamlSchema,
	type FlashcardYaml,
} from './flashcard.utils';
import {
	FlashcardSequenceContent,
	FlashcardSequenceContentSchema,
	FlashcardSequenceSchema,
} from './flashcard.sequence';
import {
	FlashcardQuizContent,
	FlashcardQuizContentSchema,
	FlashcardQuizSchema,
} from './flashcard.quiz';
import {
	FlashcardClozeContent,
	FlashcardClozeContentSchema,
	FlashcardClozeSchema,
} from './flashcard.cloze';
import {
	FlashcardBaseContent,
	FlashcardBaseContentSchema,
	FlashcardBaseSchema,
} from './flashcard.base';

export { CardType, CardStatus, CardTypeSchema, DEFAULT_FLASHCARD_YAML, FlashcardYamlSchema };
export type { FlashcardYaml };

export const FlashcardContentSchema = z.union([
	FlashcardBaseContentSchema,
	FlashcardSequenceContentSchema,
	FlashcardQuizContentSchema,
	FlashcardClozeContentSchema,
]);

export const FlashcardMetadataSchema = FlashcardYamlSchema.extend({
	file: z.string().min(1),
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
});

export const FlashcardIndexSchema = z.object({
	flashcards: z.array(FlashcardMetadataSchema),
	updated_at: z.iso.datetime().nullable(),
});

export type FlashcardIndex = z.infer<typeof FlashcardIndexSchema>;
export type FlashcardMetadata = z.infer<typeof FlashcardMetadataSchema>;
export type Flashcard =
	| FlashcardBaseSchema
	| FlashcardSequenceSchema
	| FlashcardQuizSchema
	| FlashcardClozeSchema;

export function isFlashcardBase(card: Flashcard): card is FlashcardBaseSchema {
	return card.card_type === CardType.Basic;
}

export function isFlashcardSequence(card: Flashcard): card is FlashcardSequenceSchema {
	return card.card_type === CardType.Sequence;
}

export function isFlashcardQuiz(card: Flashcard): card is FlashcardQuizSchema {
	return card.card_type === CardType.Quiz;
}

export function isFlashcardCloze(card: Flashcard): card is FlashcardClozeSchema {
	return card.card_type === CardType.Cloze;
}
export type FlashcardContent =
	| FlashcardBaseContent
	| FlashcardSequenceContent
	| FlashcardQuizContent
	| FlashcardClozeContent;

export const DEFAULT_FLASHCARD_METADATA: Omit<FlashcardMetadata, 'uuid' | 'file'> = {
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...DEFAULT_FSRS,
	...DEFAULT_FLASHCARD_YAML,
	card_type: CardType.Basic,
};

export const DEFAULT_FLASHCARD_INDEX: FlashcardIndex = {
	flashcards: [],
	updated_at: null,
};

export const AUTO_SCORED_TYPES = new Set<CardType>([CardType.Sequence, CardType.Quiz]);
