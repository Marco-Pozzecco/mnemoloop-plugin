import { IndexManager } from '@/core/indexer';
import { App } from 'obsidian';
import { CardStatus, Flashcard, ParserSettings } from '../parser/utils/types';
import { DEFAULT_FILTER, DueQueue, DueQueueFilter } from './utils/types';
import { FlashcardManager } from '../parser';
import { VaultAdapter } from '@/obsidian/VaultAdapter';
import { PluginSettings } from '@/obsidian/schema/SettingsSchema';
import { Logger } from '@/utils/Logger';

const DueQueueInitialState: DueQueue = { cards: [], totalDue: 0 };

/**
 * Generator for daily flashcard review queues.
 * Filters and sorts cards from the index based on due dates and status.
 */
export class DueQueueManager {
	static instance: DueQueueManager;
	private indexManager: IndexManager;
	private cachedQueue: DueQueue = DueQueueInitialState;
	private flashcardManager: FlashcardManager;
	private lastFilter: string = '';

	/**
	 * @param index The flashcard index containing all card metadata
	 */
	constructor(app: App, settings: Partial<PluginSettings>) {
		this.indexManager = IndexManager.getInstance(app);
		const vaultAdapter = new VaultAdapter(app);
		this.flashcardManager = new FlashcardManager(vaultAdapter, settings);
	}

	static getInstance(app: App, settings: Partial<PluginSettings>): DueQueueManager {
		if (!DueQueueManager.instance) {
			DueQueueManager.instance = new DueQueueManager(app, settings);
		}
		return DueQueueManager.instance;
	}

	get dueQueue() {
		return this.cachedQueue;
	}

	/**
	 * Generates a queue of cards due for review.
	 * Results are cached until the index changes or a different filter is used.
	 *
	 * @param filter Options for filtering the due queue
	 * @returns A sorted DueQueue containing cards due for review
	 */
	async generate(filter: DueQueueFilter = DEFAULT_FILTER): Promise<DueQueue> {
		Logger.info('Generating due queue');
		const filterKey = JSON.stringify(filter);
		if (this.cachedQueue && this.lastFilter === filterKey) {
			return this.cachedQueue;
		}

		const now = new Date();
		const cards: Flashcard[] = [];
		const cardTimestamps = new Map<string, number>();
		const index = this.indexManager.index;

		Logger.info('Cards available in index', index.cards);

		for (const uuid in index.cards) {
			const { file } = index.cards[uuid];
			const { flashcard, success, error } = await this.flashcardManager.parse(file);

			if (!success) {
				console.error(`Failed to parse flashcard ${uuid}: ${error}`);
				continue;
			}

			if (this.shouldInclude(flashcard, filter, now)) {
				cards.push(flashcard);
				cardTimestamps.set(flashcard.uuid, new Date(flashcard.srs.next_review).getTime());
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
		this.cachedQueue = DueQueueInitialState;
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

	private shouldInclude(card: Flashcard, filter: DueQueueFilter, reviewDate: Date): boolean {
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

			Logger.info('nextReview', nextReview);
			Logger.info('reviewDate', reviewDate);
			Logger.info('Is in Review', nextReview <= reviewDate);

			return nextReview <= reviewDate;
		}

		return false;
	}
}
