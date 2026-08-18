import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import ManageDeckCell from '@/ui/components/sections/Manage/Table/DeckCell/component.svelte';
import { CardStatus, CardType } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';

function makeCard(id: string, decks: string[]): FlashcardMetadata {
	return {
		uuid: `uuid-${id}`,
		file: `${id}.md`,
		card_type: CardType.Basic,
		status: CardStatus.ACTIVE,
		decks,
		due: 0,
	} as unknown as FlashcardMetadata;
}

function noopProps(overrides: Record<string, unknown> = {}) {
	return {
		card: makeCard('a', ['Math', 'Lang']),
		deckOptions: ['Math', 'Lang', 'Spanish'],
		onAddDeck: () => {},
		onRemoveDeck: () => {},
		...overrides,
	};
}

describe('ManageDeckCell', () => {
	it('renders deck chips and a plus trigger', () => {
		const { body } = render(ManageDeckCell, { props: noopProps() });
		expect(body).toContain('Math');
		expect(body).toContain('Lang');
		expect(body).toContain('ml-manage-deck-cell__display');
		expect(body).toContain('ml-manage-deck-cell__plus');
	});

	it('renders a "No decks" fallback when the card has no decks', () => {
		const { body } = render(ManageDeckCell, {
			props: noopProps({ card: makeCard('a', []) }),
		});
		expect(body).toContain('No decks');
	});

	it('labels the plus trigger with the card file', () => {
		const { body } = render(ManageDeckCell, { props: noopProps() });
		expect(body).toContain('aria-label="Add deck to a.md"');
	});

	it('does not render the picker overlay content while closed', () => {
		const { body } = render(ManageDeckCell, { props: noopProps() });
		expect(body).not.toContain('ml-combobox__input');
		expect(body).not.toContain('Remove deck');
		expect(body).not.toContain('Search or create deck');
	});
});
