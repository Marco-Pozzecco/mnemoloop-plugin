import { z } from 'zod';
import { DEFAULT_FSRS } from '@/utils/constants';
import { FSRSParams } from './srs';

export enum CardType {
	Basic = 'basic',
	Sequence = 'sequence',
	Quiz = 'quiz',
	Cloze = 'cloze',
}

export enum CardStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
	PAUSED = 'PAUSED',
	STALE = 'STALE',
}

export const CardTypeSchema = z.enum([
	CardType.Basic,
	CardType.Sequence,
	CardType.Quiz,
	CardType.Cloze,
]);

export const FlashcardYamlSchema = FSRSParams.extend({
	uuid: z.uuid(),
	source: z
		.string()
		.regex(/^\[\[.*\]\]$/, 'Must be valid Obsidian link format')
		.nullable(),
	status: z.enum(CardStatus),
	decks: z.preprocess((val) => val ?? undefined, z.array(z.string()).default([])),
	card_type: CardTypeSchema.default(CardType.Basic),
});

export type FlashcardYaml = z.infer<typeof FlashcardYamlSchema>;

export const DEFAULT_FLASHCARD_YAML: Omit<FlashcardYaml, 'uuid'> = {
	...DEFAULT_FSRS,
	source: null,
	status: CardStatus.ACTIVE,
	decks: [],
	card_type: CardType.Basic,
};
