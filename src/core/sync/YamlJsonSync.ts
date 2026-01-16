import { IVaultAdapter } from '@/obsidian/contracts/IVaultAdapter';
import { SyncResult, SyncConflict, ISyncNotifier } from './types';
import { YamlEngine } from '../parser/engine/YamlEngine';
import { FlashcardMetadata } from '../parser/types';
import { Index } from '../indexer';

/**
 * Manager for bidirectional synchronization between JSON index and YAML frontmatter.
 * Implements last-write-wins strategy for conflict resolution.
 */
export class YamlJsonSync {
	private vaultAdapter: IVaultAdapter;
	private index: Index;
	private yamlExtractor: YamlEngine;
	private notifier?: ISyncNotifier;

	/**
	 * @param vaultAdapter Adapter for Obsidian Vault operations
	 * @param index Flashcard index to synchronize
	 * @param notifier Optional notifier for conflicts and errors
	 */
	constructor(vaultAdapter: IVaultAdapter, index: Index, notifier?: ISyncNotifier) {
		this.vaultAdapter = vaultAdapter;
		this.index = index;
		this.yamlExtractor = new YamlEngine(vaultAdapter);
		this.notifier = notifier;
	}

	/**
	 * Detects conflicts between JSON index and YAML frontmatter.
	 * Applies last-write-wins strategy based on 'updated' timestamp.
	 *
	 * @param jsonMetadata Metadata from JSON index
	 * @param yamlMetadata Metadata extracted from YAML
	 * @returns A SyncConflict object if a conflict is detected, null otherwise
	 */
	detectConflict(
		jsonMetadata: FlashcardMetadata,
		yamlMetadata: FlashcardMetadata,
	): SyncConflict | null {
		const jsonUpdated = new Date(jsonMetadata.updated).getTime();
		const yamlUpdated = new Date(yamlMetadata.updated).getTime();

		if (jsonUpdated === yamlUpdated) {
			if (
				JSON.stringify(jsonMetadata.srs) === JSON.stringify(yamlMetadata.srs) &&
				jsonMetadata.status === yamlMetadata.status
			) {
				return null;
			}
			return {
				field: 'metadata',
				json_value: jsonMetadata,
				yaml_value: yamlMetadata,
				last_write: 'json',
				resolved_value: jsonMetadata,
			};
		}

		const lastWrite = jsonUpdated > yamlUpdated ? 'json' : 'yaml';

		if (
			JSON.stringify(jsonMetadata.srs) !== JSON.stringify(yamlMetadata.srs) ||
			jsonMetadata.status !== yamlMetadata.status
		) {
			return {
				field: 'metadata',
				json_value: jsonMetadata,
				yaml_value: yamlMetadata,
				last_write: lastWrite,
				resolved_value: lastWrite === 'json' ? jsonMetadata : yamlMetadata,
			};
		}

		return null;
	}

	/**
	 * Updates YAML file with FSRS parameters from JSON index.
	 *
	 * @param uuid Unique identifier of the flashcard
	 * @returns Result of the synchronization operation
	 */
	async syncJsonToYaml(uuid: string): Promise<SyncResult> {
		const jsonMetadata = this.index.cards[uuid];
		if (!jsonMetadata) {
			return {
				success: false,
				conflicts_resolved: 0,
				errors: [`Flashcard with UUID ${uuid} not found in index`],
			};
		}

		try {
			const filePath = jsonMetadata.file;
			if (!(await this.vaultAdapter.fileExists(filePath))) {
				return { success: false, conflicts_resolved: 0, errors: [`File ${filePath} not found`] };
			}

			const content = await this.vaultAdapter.readFile(filePath);
			const updatedContent = this.updateFrontmatter(content, jsonMetadata);

			if (content === updatedContent) {
				return { success: true, conflicts_resolved: 0, errors: [] };
			}

			await this.vaultAdapter.writeFile(filePath, updatedContent);
			return { success: true, conflicts_resolved: 0, errors: [] };
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : 'Unknown error during syncJsonToYaml';
			this.notifier?.logError(errorMsg);
			return { success: false, conflicts_resolved: 0, errors: [errorMsg] };
		}
	}

	/**
	 * Updates JSON index with metadata from YAML file.
	 *
	 * @param filePath Path to the markdown file in the vault
	 * @returns Result of the synchronization operation
	 */
	async syncYamlToJson(filePath: string): Promise<SyncResult> {
		try {
			const parseResult = await this.yamlExtractor.extract(filePath);
			if (!parseResult.success || !parseResult.metadata) {
				return {
					success: false,
					conflicts_resolved: 0,
					errors: [parseResult.error || 'Failed to parse YAML'],
				};
			}

			const yamlMetadata = parseResult.metadata;
			const uuid = yamlMetadata.uuid;
			const jsonMetadata = this.index.cards[uuid];

			if (jsonMetadata) {
				const conflict = this.detectConflict(jsonMetadata, yamlMetadata);
				if (conflict) {
					this.notifier?.notifyConflict(conflict);
					if (conflict.last_write === 'yaml') {
						this.index.cards[uuid] = yamlMetadata;
						this.index.last_updated = new Date().toISOString();
						return { success: true, conflicts_resolved: 1, errors: [] };
					} else {
						// JSON wins, we don't update index but we might want to trigger syncJsonToYaml
						return { success: true, conflicts_resolved: 1, errors: [] };
					}
				}
			}

			// No conflict or new card
			this.index.cards[uuid] = yamlMetadata;
			this.index.last_updated = new Date().toISOString();
			return { success: true, conflicts_resolved: 0, errors: [] };
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : 'Unknown error during syncYamlToJson';
			this.notifier?.logError(errorMsg);
			return { success: false, conflicts_resolved: 0, errors: [errorMsg] };
		}
	}

	/**
	 * Updates file path in JSON index when flashcard is moved/renamed.
	 *
	 * @param oldPath Original file path
	 * @param newPath New file path
	 */
	handleFileRename(oldPath: string, newPath: string): void {
		const card = Object.values(this.index.cards).find((c) => c.file === oldPath);
		if (card) {
			card.file = newPath;
			card.updated = new Date().toISOString();
			this.index.last_updated = new Date().toISOString();
		}
	}

	/**
	 * Helper to update frontmatter content with new metadata.
	 */
	private updateFrontmatter(content: string, metadata: FlashcardMetadata): string {
		const yamlRegex = /^---\n([\s\S]*?)\n---/;
		const match = content.match(yamlRegex);
		const newYaml = this.generateYaml(metadata);

		if (!match) {
			return `---\n${newYaml}\n---\n\n${content}`;
		}

		return content.replace(yamlRegex, `---\n${newYaml}\n---`);
	}

	/**
	 * Helper to generate YAML string from metadata.
	 */
	private generateYaml(metadata: FlashcardMetadata): string {
		const lines = [
			`uuid: ${metadata.uuid}`,
			`source: ${metadata.source}`,
			`created: ${metadata.created}`,
			`updated: ${metadata.updated}`,
			`status: ${metadata.status}`,
		];

		if (metadata.deleted_at) {
			lines.push(`deleted_at: ${metadata.deleted_at}`);
		} else {
			lines.push(`deleted_at: null`);
		}

		lines.push(`# FSRS Parameters`);
		lines.push(`srs_stability: ${metadata.srs.stability}`);
		lines.push(`srs_difficulty: ${metadata.srs.difficulty}`);
		lines.push(`srs_state: ${metadata.srs.state}`);
		lines.push(`srs_last_review: ${metadata.srs.last_review ? metadata.srs.last_review : 'null'}`);
		lines.push(`srs_next_review: ${metadata.srs.next_review}`);
		lines.push(`srs_reps: ${metadata.srs.reps}`);

		if (metadata.srs.elapsed_days !== undefined)
			lines.push(`srs_elapsed_days: ${metadata.srs.elapsed_days}`);
		if (metadata.srs.scheduled_days !== undefined)
			lines.push(`srs_scheduled_days: ${metadata.srs.scheduled_days}`);
		if (metadata.srs.learning_steps !== undefined)
			lines.push(`srs_learning_steps: ${metadata.srs.learning_steps}`);
		if (metadata.srs.lapses !== undefined) lines.push(`srs_lapses: ${metadata.srs.lapses}`);

		return lines.join('\n');
	}
}
