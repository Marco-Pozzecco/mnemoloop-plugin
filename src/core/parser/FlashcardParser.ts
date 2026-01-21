import { VaultAdapter } from '@/obsidian/VaultAdapter';
import { ERROR_MESSAGES } from '@/utils/constants';
import { YamlEngine } from './YamlEngine';
import { ContentSplitResult, Flashcard, ParseResult, ParserSettings } from './utils/types';
import { PluginSettings } from '@/obsidian/schema/SettingsSchema';

/**
 * Core parser for flashcard markdown files.
 * It is responsible for:
 * - YAML extraction and content splitting by a marker.
 */
export class FlashcardParser {
	private yaml: YamlEngine;
	private vaultAdapter: VaultAdapter;
	private settings: ParserSettings;
	private cache: Map<string, { result: ParseResult; timestamp: number }> = new Map();

	/**
	 * @param vaultAdapter Adapter for Obsidian Vault operations
	 * @param settings Optional parser settings (directory, marker)
	 */
	constructor(vaultAdapter: VaultAdapter, settings?: Partial<PluginSettings>) {
		this.vaultAdapter = vaultAdapter;
		this.yaml = new YamlEngine(vaultAdapter);
		this.settings = {
			flashcard_directory: settings?.flashcardsDirectory ?? '/flashcards/',
			marker: '?',
		};
	}

	/**
	 * Parses a flashcard file into a structured Flashcard object.
	 * Results are cached to improve performance.
	 *
	 * @param filePath Path to the markdown file in the vault
	 * @param forceRefresh If true, bypasses the cache
	 * @returns A ParseResult containing the flashcard or an error
	 */
	async parse(filePath: string, forceRefresh = false): Promise<ParseResult> {
		if (!forceRefresh) {
			const cached = this.cache.get(filePath);
			if (cached && Date.now() - cached.timestamp < 30000) {
				// 30s cache
				return cached.result;
			}
		}

		try {
			const content = await this.vaultAdapter.readFile(filePath);
			const yamlResult = await this.yaml.extract(filePath);

			if (!yamlResult.success || !yamlResult.metadata) {
				const errorResult = {
					success: false,
					flashcard: undefined,
					error: yamlResult.error || ERROR_MESSAGES.INVALID_YAML,
				} as const;
				this.cache.set(filePath, { result: errorResult, timestamp: Date.now() });
				return errorResult;
			}

			const splitResult = this.splitContent(content);

			if (!splitResult.success || !splitResult.front) {
				const errorResult = {
					success: false,
					flashcard: undefined,
					error: splitResult.error || ERROR_MESSAGES.MISSING_MARKER,
				} as const;
				this.cache.set(filePath, { result: errorResult, timestamp: Date.now() });
				return errorResult;
			}

			const flashcard: Flashcard = {
				...yamlResult.metadata,
				front: splitResult.front,
				back: splitResult.back ?? '',
			};

			const successResult = {
				success: true,
				flashcard,
				error: undefined,
			} as const;

			this.cache.set(filePath, { result: successResult, timestamp: Date.now() });
			return successResult;
		} catch (error) {
			return {
				flashcard: undefined,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error parsing flashcard',
			};
		}
	}

	/**
	 * Clears the parser cache.
	 */
	clearCache(filePath?: string): void {
		if (filePath) {
			this.cache.delete(filePath);
		} else {
			this.cache.clear();
		}
	}

	/**
	 * Splits the body content into front and back parts using the configured marker.
	 *
	 * @param content Full content of the markdown file
	 * @returns A ContentSplitResult containing front and back content
	 */
	splitContent(content: string): ContentSplitResult {
		try {
			const bodyContent = this.removeFrontmatter(content);
			const marker = this.settings.marker;

			const markerIndex = bodyContent.indexOf(marker);

			if (markerIndex === -1) {
				return {
					success: false,
					error: ERROR_MESSAGES.MISSING_MARKER,
				};
			}

			const front = bodyContent.substring(0, markerIndex).trim();
			const back = bodyContent.substring(markerIndex + marker.length).trim();

			return {
				success: true,
				front: this.preserveMarkdown(front),
				back: this.preserveMarkdown(back),
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error splitting content',
			};
		}
	}

	/**
	 * Removes YAML frontmatter from content to get the body.
	 */
	private removeFrontmatter(content: string): string {
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (frontmatterMatch) {
			return content.substring(frontmatterMatch[0].length).trim();
		}
		return content;
	}

	/**
	 * Placeholder for markdown preservation logic (LaTeX, code blocks, etc.)
	 */
	private preserveMarkdown(content: string): string {
		return content;
	}

	/**
	 * Updates parser settings.
	 */
	updateSettings(settings: Partial<ParserSettings>): void {
		this.settings = {
			...this.settings,
			...settings,
		};
	}

	/**
	 * Returns current parser settings.
	 */
	getSettings(): ParserSettings {
		return { ...this.settings };
	}
}
