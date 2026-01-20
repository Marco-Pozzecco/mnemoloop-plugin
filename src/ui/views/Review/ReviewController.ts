import { App, TFile } from 'obsidian';
import type { Flashcard } from '@/core/parser/utils/types';
import type { IReviewController } from './types';
import { IndexManager } from '@/core/indexer/IndexerManager';
import { SessionStore } from '@/ui/stores/SessionStore';

export class ReviewController implements IReviewController {
	private indexManager: IndexManager;
	private sessionStore: SessionStore;

	constructor(
		private app: App,
		indexManager: IndexManager,
		sessionStore: SessionStore,
	) {
		this.indexManager = indexManager;
		this.sessionStore = sessionStore;
	}

	async getNextCard(): Promise<Flashcard | null> {
		// The current card is managed by the SessionStore
		// This method could be used to proactively fetch if needed
		let card: Flashcard | null = null;
		this.sessionStore.subscribe((state) => {
			card = state.currentCard;
		})();
		return card;
	}

	async submitRating(cardId: string, rating: 1 | 2 | 3 | 4): Promise<void> {
		await this.sessionStore.submitRating(rating);
	}

	async editSource(cardId: string): Promise<void> {
		try {
			// Get card metadata from index
			const cardMetadata = this.indexManager.getCard(cardId);

			if (!cardMetadata) {
				throw new Error(`Card with ID '${cardId}' not found in index`);
			}

			// Get the source file path from card metadata
			const sourcePath = cardMetadata.source;

			if (!sourcePath) {
				throw new Error(`No source path found for card '${cardId}'`);
			}

			// Get the TFile object from the vault
			const file = this.app.vault.getAbstractFileByPath(sourcePath);

			if (!(file instanceof TFile)) {
				throw new Error(`Source file '${sourcePath}' not found or is not a file`);
			}

			// Open the file in a new leaf (split view)
			const leaf = this.app.workspace.getLeaf('split');
			await leaf.openFile(file);

			console.log(`Opened source file '${sourcePath}' for card '${cardId}'`);
		} catch (error) {
			console.error('Failed to edit source:', error);
			throw error;
		}
	}

	async verifyAndReset(cardId: string): Promise<void> {
		// For STALE cards, reset to ACTIVE
		console.log('Verifying and resetting card:', cardId);
	}
}
