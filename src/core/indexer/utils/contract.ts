import { FlashcardMetadata } from '../schema/IndexerSchema';

export interface IIndexManager {
	/**
	 * Read all flashcards from specified directory, load them to memory and save index
	 */
	initialize(): Promise<void>;

	/**
	 * Load index.json into memory
	 */
	load(): Promise<void>;

	/**
	 * Save index.json to disk
	 */
	save(): Promise<void>;

	/**
	 * Retrieve card from cache
	 * @param id - Card's uuid
	 */
	getCard(id: string): FlashcardMetadata | undefined;

	/**
	 * Update card in cache
	 * @param id - Card's uuid
	 * @param data - Partial card metadata
	 */
	upsertCard(id: string, data: Partial<FlashcardMetadata>): void;

	/**
	 * Delete card from cache
	 * @param id - Card's uuid
	 */
	deleteCard(id: string): void;

	/**
	 * Rebuild index from vault
	 */
	rebuildFromVault(): Promise<void>;

	/**
	 * Find cards by source path
	 * @param sourcePath - Source path
	 */
	findCardsBySource(sourcePath: string): FlashcardMetadata[];

	/**
	 * Get all cards from cache
	 */
	getAllCards(): FlashcardMetadata[];
}
