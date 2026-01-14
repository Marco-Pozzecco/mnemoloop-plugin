import { DueQueue, DueQueueFilter, DEFAULT_FILTER } from './types';
import { Index } from '../sync/types';
import { CardStatus, Flashcard } from '../parser/types';

/**
 * Generator for daily flashcard review queues.
 * Filters and sorts cards from the index based on due dates and status.
 */
export class DueQueueGenerator {
	private index: Index;

	/**
	 * @param index The flashcard index containing all card metadata
	 */
	constructor(index: Index) {
		this.index = index;
	}

	/**
	 * Generates a queue of cards due for review.
	 * 
	 * @param filter Options for filtering the due queue
	 * @returns A sorted DueQueue containing cards due for review
	 */
	generate(filter: DueQueueFilter = DEFAULT_FILTER): DueQueue {
		const now = new Date();
		const cards: Flashcard[] = [];

		for (const uuid in this.index.cards) {
			const card = this.index.cards[uuid] as Flashcard;

			if (this.shouldInclude(card, filter, now)) {
				cards.push(card);
			}
		}

		// Sort cards: primary by next_review (ascending), secondary by difficulty (descending)
		cards.sort((a, b) => {
			const dateA = new Date(a.srs.next_review).getTime();
			const dateB = new Date(b.srs.next_review).getTime();

			if (dateA !== dateB) {
				return dateA - dateB;
			}

			// Higher difficulty first for cards due at the same time
			return b.srs.difficulty - a.srs.difficulty;
		});

		// Apply max_cards limit if specified
		const limitedCards = filter.max_cards ? cards.slice(0, filter.max_cards) : cards;

		return {
			totalDue: limitedCards.length,
			cards: limitedCards,
		};
	}

	/**
	 * Gets all cards with STALE status.
	 */
	getStaleCards(): Flashcard[] {
		return this.filterByStatus(CardStatus.STALE);
	}

	/**
	 * Gets all cards with PAUSED status.
	 */
	getPausedCards(): Flashcard[] {
		return this.filterByStatus(CardStatus.PAUSED);
	}

	private filterByStatus(status: CardStatus): Flashcard[] {
		const result: Flashcard[] = [];
		for (const uuid in this.index.cards) {
			const card = this.index.cards[uuid] as Flashcard;
			if (card.status === status) {
				result.push(card);
			}
		}
		return result;
	}

	private shouldInclude(card: Flashcard, filter: DueQueueFilter, now: Date): boolean {
		// Basic status check
		if (card.status === CardStatus.DELETED && !filter.include_deleted) {
			return false;
		}

		if (card.status === CardStatus.PAUSED && !filter.include_paused) {
			return false;
		}

		if (card.status === CardStatus.STALE && !filter.include_stale) {
			return false;
		}

		// ACTIVE cards (and others if included by filter) must be due
		if (card.status === CardStatus.ACTIVE || 
			(card.status === CardStatus.STALE && filter.include_stale) ||
			(card.status === CardStatus.PAUSED && filter.include_paused) ||
			(card.status === CardStatus.DELETED && filter.include_deleted)) {
			
			const nextReview = new Date(card.srs.next_review);
			return nextReview <= now;
		}

		return false;
	}
}
