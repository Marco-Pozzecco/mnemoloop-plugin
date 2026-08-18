import { CardType } from '@/schemas';
import type { Flashcard, FlashcardMetadata } from '@/schemas';
import { FlashcardClozeRegex } from '@/schemas/flashcard.cloze';
import type { ManageFilters } from '@/ui/store/manage.store';

export const MANAGE_PAGE_SIZE = 25;
export const MANAGE_PREVIEW_LIMIT = 60;

export function filterFlashcards(
	cards: FlashcardMetadata[],
	filters: ManageFilters,
): FlashcardMetadata[] {
	return cards.filter((card) => {
		if (filters.type && card.card_type !== filters.type) return false;
		if (filters.status && card.status !== filters.status) return false;
		if (filters.deck && !card.decks.includes(filters.deck)) return false;
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

export function buildCardPreview(card: Flashcard): string {
	switch (card.card_type) {
		case CardType.Basic:
			return truncate(card.content.front);
		case CardType.Sequence:
			return truncate(`Steps: ${card.content.steps[0] ?? ''}`);
		case CardType.Quiz:
			return truncate(card.content.question);
		case CardType.Cloze:
			return truncate(card.content.text.replace(FlashcardClozeRegex, '[...]'));
	}
}
