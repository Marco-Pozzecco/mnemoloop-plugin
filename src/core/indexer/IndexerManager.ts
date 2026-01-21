import { CardStatus, YamlEngine } from '@/core/parser';
import { VaultAdapter } from '@/obsidian/VaultAdapter';
import { Logger } from '@/utils/Logger';
import { DEFAULT_FSRS } from '@/utils/constants';
import { App } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { MetadataCache } from '../../utils/MetadataCache';
import {
	FlashcardMetadata,
	FlashcardMetadataSchema,
	Index,
	IndexSchema,
} from './schema/IndexerSchema';
import { IIndexManager } from './utils/contract';

/**
 * Role:
 * - create an in memory index of all the flashcards present on disk during initialization
 * - persistance of the index on disk
 */
export class IndexManager implements IIndexManager {
	static instance: IndexManager;
	private vaultAdapter: VaultAdapter;
	private yamlEngine: YamlEngine;
	private app: App;
	private cache: MetadataCache;
	private version: number = 1;
	private last_updated: Date = new Date();
	private readonly INDEX_FILE = 'knowledge-accelerator/index.json';

	constructor(app: App) {
		this.app = app;
		this.vaultAdapter = new VaultAdapter(app);
		this.yamlEngine = new YamlEngine(this.vaultAdapter);
		this.cache = new MetadataCache();
	}

	static getInstance(app: App): IndexManager {
		if (!this.instance) {
			this.instance = new IndexManager(app);
		}
		return this.instance;
	}

	get index() {
		const index: Index = {
			version: this.version,
			cards: this.getAllCards().reduce(
				(acc, card) => {
					acc[card.uuid] = card;
					return acc;
				},
				{} as Record<string, FlashcardMetadata>,
			),
			last_updated: this.last_updated.toISOString(),
		};
		return index;
	}

	async initialize(): Promise<void> {
		Logger.info('Initializing index');
		await this.rebuildFromVault();
	}

	async load(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			if (await adapter.exists(this.INDEX_FILE)) {
				const data = await adapter.read(this.INDEX_FILE);
				const parsedIndex: unknown = JSON.parse(data);

				const validatedIndex = IndexSchema.parse(parsedIndex);

				if (validatedIndex.version !== this.version) {
					// Handle migrations in the future
					console.warn(
						`Index version mismatch: expected ${this.version}, got ${validatedIndex.version}`,
					);
				}

				this.cache.load(validatedIndex.cards);
				this.version = validatedIndex.version;
				this.last_updated = new Date(validatedIndex.last_updated);
			} else {
				// Create empty index
				return await this.save();
			}
		} catch (error) {
			console.error('Failed to load index:', error);
			// Don't throw on parse errors to allow recovery
			if (error instanceof Error && error.message.includes('JSON.parse')) {
				console.warn('Index file corrupted, will rebuild from vault');
				return;
			}
			throw new Error(
				`Index loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	async save(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			// Ensure directory exists
			const dir = this.INDEX_FILE.split('/').slice(0, -1).join('/');
			if (!(await adapter.exists(dir))) {
				await adapter.mkdir(dir);
			}

			const index: Index = {
				version: this.version,
				last_updated: new Date().toISOString(),
				cards: Object.fromEntries(this.cache.getAll()) as Record<string, FlashcardMetadata>,
			};

			const validatedIndex = IndexSchema.parse(index);
			await adapter.write(this.INDEX_FILE, JSON.stringify(validatedIndex, null, 2));

			this.cache.markClean();
			this.version = validatedIndex.version;
			this.last_updated = new Date(validatedIndex.last_updated);
		} catch (error) {
			console.error('Failed to save index:', error);
			throw new Error(
				`Index saving failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	getCard(id: string): FlashcardMetadata | undefined {
		return this.cache.get(id);
	}

	upsertCard(id: string, data: Partial<FlashcardMetadata>): void {
		const existingCard = this.cache.get(id);
		const updatedCard = {
			...(existingCard || {}),
			...data,
			updated: new Date().toISOString(),
		};
		const validatedCard = FlashcardMetadataSchema.parse(updatedCard);
		this.cache.set(id, validatedCard);
		this.last_updated = new Date();
	}

	deleteCard(id: string): void {
		const existingCard = this.cache.get(id);
		if (existingCard) {
			const deletedCard = {
				...existingCard,
				status: 'DELETED' as const,
				deleted_at: new Date().toISOString(),
				updated: new Date().toISOString(),
			};
			const validatedCard = FlashcardMetadataSchema.parse(deletedCard);
			this.cache.set(id, validatedCard);
			this.last_updated = new Date();
		}
	}

	async rebuildFromVault(): Promise<void> {
		try {
			this.cache.clear();

			const flashcardFolder = 'flashcards';
			const adapter = this.app.vault.adapter;

			if (!(await adapter.exists(flashcardFolder))) {
				Logger.warn(`Flashcard folder '${flashcardFolder}' not found`);
				return;
			}

			const { files } = await this.vaultAdapter.list(flashcardFolder);

			for (const file of files) {
				if (file.endsWith('.md')) {
					try {
						Logger.info(`Processing file ${file}`);
						const { error, metadata, success } = await this.yamlEngine.extract(file);

						if (success === false) {
							Logger.error(`Error parsing YAML in file ${file}: ${error}`);
						}

						Logger.info(`Validating metadata for file ${file}`);
						if (metadata) {
							Logger.info(`Metadata is present`, metadata);
							const validatedCard = FlashcardMetadataSchema.parse(metadata);
							this.cache.set(metadata.uuid, validatedCard);
						} else {
							const cardData: FlashcardMetadata = {
								uuid: uuid(),
								file,
								source: null,
								status: CardStatus.ACTIVE,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
								deleted_at: null,
								srs: DEFAULT_FSRS,
							};

							const validatedCard = FlashcardMetadataSchema.parse(cardData);
							const yamlMetadata = await this.yamlEngine.generateYaml(cardData);
							const content = await this.vaultAdapter.readFile(file);

							await this.vaultAdapter.writeFile(file, yamlMetadata + '\n' + content);
							this.cache.set(cardData.uuid, validatedCard);
						}
					} catch (error) {
						console.error(`Failed to process file '${file}':`, error);
						// Continue processing other files
					}
				}
			}

			await this.save();
		} catch (error) {
			console.error('Failed to rebuild index from vault:', error);
			throw new Error(
				`Index rebuild failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	findCardsBySource(sourcePath: string): FlashcardMetadata[] {
		return this.cache.query((card) => card.source === sourcePath);
	}

	getAllCards(): FlashcardMetadata[] {
		return Array.from(this.cache.getAll().values());
	}
}
