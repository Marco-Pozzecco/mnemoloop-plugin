import { App } from 'obsidian';
import { MetadataCache } from '../cache/MetadataCache';
import { IIndexManager } from '../contracts/IIndexManager';
import { CardMetadata, CardMetadataSchema, Index, IndexSchema } from '../schema/indexSchema';
import { CardStatus } from '@/core/parser';
import { v4 as uuidV4 } from 'uuid';

export class IndexManager implements IIndexManager {
	static instance: IndexManager;
	private app: App;
	private cache: MetadataCache;
	private version: number = 1;
	private last_updated: Date = new Date();
	private readonly INDEX_FILE = 'knowledge-accelerator/index.json';

	constructor(app: App) {
		this.app = app;
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
				{} as Record<string, CardMetadata>,
			),
			last_updated: this.last_updated.toISOString(),
		};
		return index;
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
				cards: Object.fromEntries(this.cache.getAll()) as Record<string, CardMetadata>,
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

	getCard(id: string): CardMetadata | undefined {
		return this.cache.get(id);
	}

	upsertCard(id: string, data: Partial<CardMetadata>): void {
		const existingCard = this.cache.get(id);
		const updatedCard = {
			...(existingCard || {}),
			...data,
			updated: new Date().toISOString(),
		};
		const validatedCard = CardMetadataSchema.parse(updatedCard);
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
			const validatedCard = CardMetadataSchema.parse(deletedCard);
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
				console.warn(`Flashcard folder '${flashcardFolder}' not found`);
				return;
			}

			const files = await adapter.list(flashcardFolder);

			for (const file of files.files) {
				if (file.endsWith('.md')) {
					try {
						const content = await adapter.read(file);
						const metadata = this.extractYamlMetadata(content, file);

						if (metadata) {
							const cardId = this.generateCardId(file);
							const cardData: CardMetadata = {
								uuid: uuidV4(),
								file,
								source: metadata.source || '',
								status: CardStatus.ACTIVE,
								created: metadata.created || new Date().toISOString(),
								updated: new Date().toISOString(),
								deleted_at: null,
								srs: metadata.srs || {
									stability: 0,
									difficulty: 5,
									state: 0,
									last_review: null,
									next_review: new Date().toISOString(),
									reps: 0,
								},
							};

							const validatedCard = CardMetadataSchema.parse(cardData);
							this.cache.set(cardId, validatedCard);
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

	findCardsBySource(sourcePath: string): CardMetadata[] {
		return this.cache.query((card) => card.source === sourcePath);
	}

	getAllCards(): CardMetadata[] {
		return Array.from(this.cache.getAll().values());
	}

	private extractYamlMetadata(content: string, filePath: string): any | null {
		try {
			const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
			if (!yamlMatch) {
				return null;
			}

			// Simple YAML parsing for our known fields
			const yamlContent = yamlMatch[1];
			const metadata: any = {};

			const lines = yamlContent.split('\n');
			for (const line of lines) {
				const match = line.match(/^(\w+):\s*(.*)$/);
				if (match) {
					const [, key, value] = match;
					if (key === 'srs' && value.startsWith('{')) {
						// Simple SRS object parsing
						metadata.srs = JSON.parse(value);
					} else if (key === 'source') {
						metadata.source = value.replace(/['"]/g, '');
					} else if (key === 'created') {
						metadata.created = value.replace(/['"]/g, '');
					}
				}
			}

			return metadata.source ? metadata : null;
		} catch (error) {
			console.error(`Failed to extract YAML metadata from '${filePath}':`, error);
			return null;
		}
	}

	private generateCardId(filePath: string): string {
		// Use normalized file path as ID
		return filePath.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]/g, '-');
	}
}
