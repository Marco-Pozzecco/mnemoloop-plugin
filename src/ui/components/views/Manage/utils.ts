import { CardType } from '@/schemas';
import type { Flashcard, FlashcardMetadata } from '@/schemas';
import { renderClozeText } from '@/utils/cloze';
import type { ManageFilters } from '@/ui/store/manage.store';

export const MANAGE_PAGE_SIZE = 25;
export const MANAGE_PREVIEW_LIMIT = 60;

/**
 * Deep link to a card's note. Used as the href of the row anchor so modifier-click
 * keeps Obsidian's native open-in-new-tab behaviour.
 */
export function cardHref(vaultName: string, file: string): string {
	return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(file)}`;
}

export function filterFlashcards(
	cards: FlashcardMetadata[],
	filters: ManageFilters,
): FlashcardMetadata[] {
	const query = (filters.query ?? '').trim().toLowerCase();
	const selectedDeck = filters.deck.trim().toLowerCase();

	return cards.filter((card) => {
		if (filters.type && card.card_type !== filters.type) return false;
		if (filters.status && card.status !== filters.status) return false;
		if (selectedDeck && !card.decks.some((deck) => deck.trim().toLowerCase() === selectedDeck))
			return false;
		if (
			query &&
			!card.file.toLowerCase().includes(query) &&
			!card.decks.some((deck) => deck.toLowerCase().includes(query))
		)
			return false;
		return true;
	});
}

export function paginate<T>(
	items: T[],
	page: number,
	pageSize: number,
): { pageItems: T[]; totalPages: number; safePage: number } {
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const start = (safePage - 1) * pageSize;
	return { pageItems: items.slice(start, start + pageSize), totalPages, safePage };
}

function truncate(text: string, limit: number = MANAGE_PREVIEW_LIMIT): string {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit)}...`;
}

/** A cloze preview truncates like any other, but never splits a `[...]` apart. */
function truncateCloze(text: string): string {
	if (text.length <= MANAGE_PREVIEW_LIMIT) return text;
	const cut = text.slice(0, MANAGE_PREVIEW_LIMIT);
	const open = cut.lastIndexOf('[');
	const safe = open > -1 && cut.indexOf(']', open) === -1 ? cut.slice(0, open) : cut;
	return `${safe}...`;
}

export function buildCardPreview(card: Flashcard): string {
	switch (card.card_type) {
		case CardType.Basic:
			return truncate(card.content.front);
		case CardType.Sequence:
			return truncate(`Steps: ${card.content.steps[0] ?? ''}`);
		case CardType.Quiz:
			return truncate(card.content.question);
		case CardType.Cloze:
			// `text` already has the answers removed; put the holes back.
			return truncateCloze(renderClozeText(card.content));
		case CardType.Occlusion: {
			const count = card.content.masks.length;
			return truncate(`Occlusion: ${card.content.image} (${count} mask${count === 1 ? '' : 's'})`);
		}
		default:
			return 'Unknown card type';
	}
}
