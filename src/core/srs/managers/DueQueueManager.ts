import { IndexManager } from '@/core/indexer';
import { App } from 'obsidian';
import { CardStatus, Flashcard } from '../../parser/types';
import { DEFAULT_FILTER, DueQueue, DueQueueFilter } from '../types';

/**
 * Generator for daily flashcard review queues.
 * Filters and sorts cards from the index based on due dates and status.
 */
export class DueQueueManager {
	static instance: DueQueueManager;
	private indexManager: IndexManager;
	private cachedQueue: DueQueue | null = null;
	private lastFilter: string = '';

	/**
	 * @param index The flashcard index containing all card metadata
	 */
	constructor(app: App) {
		this.indexManager = IndexManager.getInstance(app);
	}

	static getInstance(app: App): DueQueueManager {
		if (!DueQueueManager.instance) {
			DueQueueManager.instance = new DueQueueManager(app);
		}
		return DueQueueManager.instance;
	}

	/**
	 * Generates a queue of cards due for review.
	 * Results are cached until the index changes or a different filter is used.
	 *
	 * @param filter Options for filtering the due queue
	 * @returns A sorted DueQueue containing cards due for review
	 */
	generate(filter: DueQueueFilter = DEFAULT_FILTER): DueQueue {
		const filterKey = JSON.stringify(filter);
		if (this.cachedQueue && this.lastFilter === filterKey) {
			return this.cachedQueue;
		}

		const now = new Date();
		const cards: Flashcard[] = [];
		const cardTimestamps = new Map<string, number>();
		const index = this.indexManager.index;

		for (const uuid in index.cards) {
			const card = index.cards[uuid] as Flashcard;

			if (this.shouldInclude(card, filter, now)) {
				cards.push(card);
				cardTimestamps.set(card.uuid, new Date(card.srs.next_review).getTime());
			}
		}

		// Sort cards: primary by next_review (ascending), secondary by difficulty (descending)
		cards.sort((a, b) => {
			const dateA = cardTimestamps.get(a.uuid)!;
			const dateB = cardTimestamps.get(b.uuid)!;

			if (dateA !== dateB) {
				return dateA - dateB;
			}

			// Higher difficulty first for cards due at the same time
			return b.srs.difficulty - a.srs.difficulty;
		});

		// Apply max_cards limit if specified
		const limitedCards = filter.max_cards ? cards.slice(0, filter.max_cards) : cards;

		const result = {
			totalDue: limitedCards.length,
			cards: limitedCards,
		};

		this.cachedQueue = result;
		this.lastFilter = filterKey;

		return result;
	}

	/**
	 * Invalidates the generated queue cache.
	 * Should be called when the index is modified.
	 */
	invalidateCache(): void {
		this.cachedQueue = null;
		this.lastFilter = '';
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
		const index = this.indexManager.index;
		for (const uuid in index.cards) {
			const card = index.cards[uuid] as Flashcard;
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
		if (
			card.status === CardStatus.ACTIVE ||
			(card.status === CardStatus.STALE && filter.include_stale) ||
			(card.status === CardStatus.PAUSED && filter.include_paused) ||
			(card.status === CardStatus.DELETED && filter.include_deleted)
		) {
			const nextReview = new Date(card.srs.next_review);
			return nextReview <= now;
		}

		return false;
	}
}
