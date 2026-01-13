import { IVaultAdapter } from '@/obsidian/contracts/IVaultAdapter';
import { ERROR_MESSAGES } from '@/utils/constants';
import { YamlExtractor } from './YamlExtractor';
import { ContentSplitResult, Flashcard, ParseResult, ParserSettings } from './types';

export class FlashcardParser {
	private vaultAdapter: IVaultAdapter;
	private yamlExtractor: YamlExtractor;
	private settings: ParserSettings;

	constructor(vaultAdapter: IVaultAdapter, settings?: Partial<ParserSettings>) {
		this.vaultAdapter = vaultAdapter;
		this.yamlExtractor = new YamlExtractor(vaultAdapter);
		this.settings = {
			flashcard_directory: settings?.flashcard_directory ?? '/flashcards/',
			marker: settings?.marker ?? '?',
		};
	}

	async parse(filePath: string): Promise<ParseResult> {
		try {
			const content = await this.vaultAdapter.readFile(filePath);
			const yamlResult = await this.yamlExtractor.extract(filePath);

			if (!yamlResult.success || !yamlResult.metadata) {
				return {
					success: false,
					error: yamlResult.error || ERROR_MESSAGES.INVALID_YAML,
				};
			}

			const splitResult = this.splitContent(content);

			if (!splitResult.success || !splitResult.front) {
				return {
					success: false,
					error: splitResult.error || ERROR_MESSAGES.MISSING_MARKER,
				};
			}

			const flashcard: Flashcard = {
				...yamlResult.metadata,
				front: splitResult.front,
				back: splitResult.back ?? '',
			};

			return {
				success: true,
				flashcard,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error parsing flashcard',
			};
		}
	}

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

	private removeFrontmatter(content: string): string {
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (frontmatterMatch) {
			return content.substring(frontmatterMatch[0].length).trim();
		}
		return content;
	}

	private preserveMarkdown(content: string): string {
		return content;
	}

	updateSettings(settings: Partial<ParserSettings>): void {
		this.settings = {
			...this.settings,
			...settings,
		};
	}

	getSettings(): ParserSettings {
		return { ...this.settings };
	}
}
