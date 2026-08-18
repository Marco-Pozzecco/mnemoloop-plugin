import { describe, expect, it } from 'vitest';
import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';
import { MANAGE_PAGE_SIZE, buildCardPreview, filterFlashcards, paginate } from '@/ui/components/views/Manage/utils';
import { createCloze, createFlashcardMetadata, createSequence } from '../../../../../helpers/factories';

describe('Manage utils', () => {
	describe('filterFlashcards', () => {
		const cards = [
			createFlashcardMetadata({ uuid: 'a', card_type: CardType.Basic, status: CardStatus.ACTIVE, decks: ['Maths'] }),
			createFlashcardMetadata({ uuid: 'b', card_type: CardType.Quiz, status: CardStatus.PAUSED, decks: ['Maths'] }),
			createFlashcardMetadata({ uuid: 'c', card_type: CardType.Basic, status: CardStatus.ACTIVE, decks: ['Science'] }),
		];

		it('filters by card type', () => {
			const result = filterFlashcards(cards, { type: CardType.Basic, status: '', deck: '' });
			expect(result.map((c) => c.uuid)).toEqual(['a', 'c']);
		});

		it('filters by status', () => {
			const result = filterFlashcards(cards, { type: '', status: CardStatus.ACTIVE, deck: '' });
			expect(result.map((c) => c.uuid)).toEqual(['a', 'c']);
		});

		it('filters by deck', () => {
			const result = filterFlashcards(cards, { type: '', status: '', deck: 'Maths' });
			expect(result.map((c) => c.uuid)).toEqual(['a', 'b']);
		});

		it('combines filters', () => {
			const result = filterFlashcards(cards, {
				type: CardType.Basic,
				status: CardStatus.ACTIVE,
				deck: 'Maths',
			});
			expect(result.map((c) => c.uuid)).toEqual(['a']);
		});

		it('returns all cards when every filter is "All"', () => {
			const result = filterFlashcards(cards, { type: '', status: '', deck: '' });
			expect(result).toHaveLength(3);
		});
	});

	describe('paginate', () => {
		const items = Array.from({ length: 60 }, (_, i) => `item-${i + 1}`);

		it('returns up to pageSize items per page', () => {
			const page = paginate(items, 1, MANAGE_PAGE_SIZE);
			expect(page.pageItems).toHaveLength(MANAGE_PAGE_SIZE);
			expect(page.pageItems[0]).toBe('item-1');
			expect(page.totalPages).toBe(3);
		});

		it('slices the second page correctly', () => {
			const page = paginate(items, 2, MANAGE_PAGE_SIZE);
			expect(page.pageItems[0]).toBe('item-26');
			expect(page.pageItems).toHaveLength(MANAGE_PAGE_SIZE);
		});

		it('clamps out-of-range pages to the valid range', () => {
			expect(paginate(items, 5, MANAGE_PAGE_SIZE).safePage).toBe(3);
			expect(paginate(items, 0, MANAGE_PAGE_SIZE).safePage).toBe(1);
		});

		it('yields one empty page for an empty list', () => {
			const page = paginate([], 1, MANAGE_PAGE_SIZE);
			expect(page.totalPages).toBe(1);
			expect(page.pageItems).toEqual([]);
		});
	});

	describe('buildCardPreview', () => {
		it('builds a Basic preview from the front field', () => {
			const card = {
				...createFlashcardMetadata({ card_type: CardType.Basic }),
				content: { meta_type: CardType.Basic, front: 'What is the capital of France?', back: 'Paris' },
			} as unknown as Flashcard;
			expect(buildCardPreview(card)).toBe('What is the capital of France?');
		});

		it('builds a Sequence preview prefixed with "Steps: "', () => {
			const card = createSequence();
			expect(buildCardPreview(card)).toBe('Steps: step one');
		});

		it('builds a Quiz preview from the question field', () => {
			const card = {
				...createFlashcardMetadata({ card_type: CardType.Quiz }),
				content: { meta_type: CardType.Quiz, question: 'Pick one', options: ['a', 'b'], correct_index: 0 },
			} as unknown as Flashcard;
			expect(buildCardPreview(card)).toBe('Pick one');
		});

		it('builds a Cloze preview with {{...}} patterns replaced by [...]', () => {
			const card = {
				...createCloze(),
				content: {
					meta_type: CardType.Cloze,
					text: 'The capital of {{c1::France}} is {{c2::Paris}}',
					deletions: [
						{ id: 'c1', answer: 'France', hint: null, positions: [0] },
						{ id: 'c2', answer: 'Paris', hint: null, positions: [0] },
					],
				},
			} as unknown as Flashcard;
			expect(buildCardPreview(card)).toBe('The capital of [...] is [...]');
		});

		it('truncates previews longer than 60 characters with an ellipsis', () => {
			const card = {
				...createFlashcardMetadata({ card_type: CardType.Basic }),
				content: { meta_type: CardType.Basic, front: 'x'.repeat(70), back: 'b' },
			} as unknown as Flashcard;
			const preview = buildCardPreview(card);
			expect(preview.length).toBe(63);
			expect(preview.endsWith('...')).toBe(true);
			expect(preview.slice(0, 60)).toBe('x'.repeat(60));
		});
	});
});
