import { IVaultAdapter } from '@/obsidian/contracts/IVaultAdapter';
import { YamlExtractor } from '../parser/YamlExtractor';
import { ParserSettings } from '../parser/types';
import { IndexRecoveryResult, Index, IRecoveryNotifier } from './types';

/**
 * Resilience manager for flashcard index recovery.
 * Rebuilds the JSON index from YAML frontmatter in case of corruption or loss.
 */
export class IndexRecovery {
	private vaultAdapter: IVaultAdapter;
	private yamlExtractor: YamlExtractor;
	private settings: ParserSettings;
	private notifier?: IRecoveryNotifier;

	/**
	 * @param vaultAdapter Adapter for Obsidian Vault operations
	 * @param settings Parser settings for finding flashcards
	 * @param notifier Optional notifier for recovery status and errors
	 */
	constructor(vaultAdapter: IVaultAdapter, settings: ParserSettings, notifier?: IRecoveryNotifier) {
		this.vaultAdapter = vaultAdapter;
		this.yamlExtractor = new YamlExtractor(vaultAdapter);
		this.settings = settings;
		this.notifier = notifier;
	}

	/**
	 * Detects if the index file is corrupted or missing.
	 * 
	 * @param indexPath Path to the index.json file
	 * @returns True if the index is missing or invalid, false otherwise
	 */
	async detectCorruption(indexPath: string): Promise<boolean> {
		try {
			if (!(await this.vaultAdapter.fileExists(indexPath))) {
				return true;
			}
			const content = await this.vaultAdapter.readFile(indexPath);
			const index = JSON.parse(content);
			
			if (!index.version || !index.cards || typeof index.cards !== 'object') {
				return true;
			}
			return false;
		} catch (error) {
			return true;
		}
	}

	/**
	 * Rebuilds the index by scanning all flashcard markdown files and extracting YAML.
	 * 
	 * @param indexPath Path where the new index should be written
	 * @param statsPath Path where rebuild metrics should be written
	 * @returns A result object with recovery statistics and errors
	 */
	async rebuild(indexPath: string, statsPath: string): Promise<IndexRecoveryResult> {
		this.notifier?.notifyRecoveryStarted();
		const startTime = performance.now();
		const errors: Array<{ file: string; error: string }> = [];
		let cardsRecovered = 0;
		let cardsFailed = 0;

		const newIndex: Index = {
			version: '1.0.0',
			last_updated: new Date().toISOString(),
			cards: {},
		};

		try {
			const flashcardDir = this.settings.flashcard_directory.replace(/^\/|\/$/g, '');
			const listing = await this.vaultAdapter.list(flashcardDir);
			
			for (const file of listing.files) {
				if (file.endsWith('.md')) {
					try {
						const result = await this.yamlExtractor.extract(file);
						if (result.success && result.metadata) {
							newIndex.cards[result.metadata.uuid] = result.metadata;
							cardsRecovered++;
						} else {
							const errorMsg = result.error || 'Unknown parsing error';
							errors.push({ file, error: errorMsg });
							this.notifier?.logError(file, errorMsg);
							cardsFailed++;
						}
					} catch (e) {
						const errorMsg = e instanceof Error ? error.message : 'Fatal parsing error';
						errors.push({ file, error: errorMsg });
						this.notifier?.logError(file, errorMsg);
						cardsFailed++;
					}
				}
			}

			// Save new index
			await this.vaultAdapter.writeFile(indexPath, JSON.stringify(newIndex, null, 2));

			const duration = performance.now() - startTime;

			// Update stats
			await this.updateStats(statsPath, {
				type: 'INDEX_REBUILD',
				timestamp: newIndex.last_updated,
				cards_recovered: cardsRecovered,
				cards_failed: cardsFailed,
				duration_ms: duration,
			});

			const result: IndexRecoveryResult = {
				success: true,
				cards_recovered: cardsRecovered,
				cards_failed: cardsFailed,
				errors,
				duration_ms: duration,
			};

			this.notifier?.notifyRecoveryComplete(result);
			return result;
		} catch (error) {
			const duration = performance.now() - startTime;
			const fatalError = error instanceof Error ? error.message : 'Unknown fatal error during rebuild';
			
			const result: IndexRecoveryResult = {
				success: false,
				cards_recovered: cardsRecovered,
				cards_failed: cardsFailed,
				errors: [...errors, { file: 'GLOBAL', error: fatalError }],
				duration_ms: duration,
			};

			this.notifier?.notifyRecoveryComplete(result);
			return result;
		}
	}

	/**
	 * Updates the stats.json file with rebuild metrics.
	 */
	private async updateStats(statsPath: string, metrics: any): Promise<void> {
		try {
			let stats: any = { rebuild_history: [] };
			if (await this.vaultAdapter.fileExists(statsPath)) {
				const content = await this.vaultAdapter.readFile(statsPath);
				try {
					stats = JSON.parse(content);
				} catch (e) {
					// If stats.json is corrupted, start fresh
					stats = { rebuild_history: [] };
				}
			}
			
			if (!stats.rebuild_history) stats.rebuild_history = [];
			stats.rebuild_history.push(metrics);
			
			// Keep only last 10 rebuild records to avoid bloating stats.json
			if (stats.rebuild_history.length > 10) {
				stats.rebuild_history = stats.rebuild_history.slice(-10);
			}
			
			await this.vaultAdapter.writeFile(statsPath, JSON.stringify(stats, null, 2));
		} catch (error) {
			console.error('Failed to update stats.json:', error);
		}
	}
}


	/**
	 * Detects if the index file is corrupted or missing.
	 */
	async detectCorruption(indexPath: string): Promise<boolean> {
		try {
			if (!(await this.vaultAdapter.fileExists(indexPath))) {
				return true;
			}
			const content = await this.vaultAdapter.readFile(indexPath);
			const index = JSON.parse(content);
			
			if (!index.version || !index.cards || typeof index.cards !== 'object') {
				return true;
			}
			return false;
		} catch (error) {
			return true;
		}
	}

	/**
	 * Rebuilds the index from YAML frontmatter in flashcard files.
	 */
	async rebuild(indexPath: string, statsPath: string): Promise<IndexRecoveryResult> {
		this.notifier?.notifyRecoveryStarted();
		const startTime = performance.now();
		const errors: Array<{ file: string; error: string }> = [];
		let cardsRecovered = 0;
		let cardsFailed = 0;

		const newIndex: Index = {
			version: '1.0.0',
			last_updated: new Date().toISOString(),
			cards: {},
		};

		try {
			const flashcardDir = this.settings.flashcard_directory.replace(/^\/|\/$/g, '');
			const listing = await this.vaultAdapter.list(flashcardDir);
			
			for (const file of listing.files) {
				if (file.endsWith('.md')) {
					try {
						const result = await this.yamlExtractor.extract(file);
						if (result.success && result.metadata) {
							newIndex.cards[result.metadata.uuid] = result.metadata;
							cardsRecovered++;
						} else {
							const errorMsg = result.error || 'Unknown parsing error';
							errors.push({ file, error: errorMsg });
							this.notifier?.logError(file, errorMsg);
							cardsFailed++;
						}
					} catch (e) {
						const errorMsg = e instanceof Error ? e.message : 'Fatal parsing error';
						errors.push({ file, error: errorMsg });
						this.notifier?.logError(file, errorMsg);
						cardsFailed++;
					}
				}
			}

			// Save new index
			await this.vaultAdapter.writeFile(indexPath, JSON.stringify(newIndex, null, 2));

			const duration = performance.now() - startTime;

			// Update stats
			await this.updateStats(statsPath, {
				type: 'INDEX_REBUILD',
				timestamp: newIndex.last_updated,
				cards_recovered: cardsRecovered,
				cards_failed: cardsFailed,
				duration_ms: duration,
			});

			const result: IndexRecoveryResult = {
				success: true,
				cards_recovered: cardsRecovered,
				cards_failed: cardsFailed,
				errors,
				duration_ms: duration,
			};

			this.notifier?.notifyRecoveryComplete(result);
			return result;
		} catch (error) {
			const duration = performance.now() - startTime;
			const fatalError = error instanceof Error ? error.message : 'Unknown fatal error during rebuild';
			
			const result: IndexRecoveryResult = {
				success: false,
				cards_recovered: cardsRecovered,
				cards_failed: cardsFailed,
				errors: [...errors, { file: 'GLOBAL', error: fatalError }],
				duration_ms: duration,
			};

			this.notifier?.notifyRecoveryComplete(result);
			return result;
		}
	}

	private async updateStats(statsPath: string, metrics: any): Promise<void> {
		try {
			let stats: any = { rebuild_history: [] };
			if (await this.vaultAdapter.fileExists(statsPath)) {
				const content = await this.vaultAdapter.readFile(statsPath);
				try {
					stats = JSON.parse(content);
				} catch (e) {
					// If stats.json is corrupted, start fresh
					stats = { rebuild_history: [] };
				}
			}
			
			if (!stats.rebuild_history) stats.rebuild_history = [];
			stats.rebuild_history.push(metrics);
			
			// Keep only last 10 rebuild records to avoid bloating stats.json
			if (stats.rebuild_history.length > 10) {
				stats.rebuild_history = stats.rebuild_history.slice(-10);
			}
			
			await this.vaultAdapter.writeFile(statsPath, JSON.stringify(stats, null, 2));
		} catch (error) {
			console.error('Failed to update stats.json:', error);
		}
	}
}
