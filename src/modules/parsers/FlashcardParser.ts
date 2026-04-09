import { IAdapter } from '@/interfaces/IAdapter';
import { ParseResult } from '@/interfaces/IParser';
import { Flashcard, type FlashcardContent, type FlashcardYaml } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';
import { Logger } from '@/utils/Logger';
import { normalizePath, Plugin } from 'obsidian';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { BaseParser } from './BaseParser';

export class FlashcardParser extends BaseParser<Flashcard, FlashcardYaml> {
	private _settings: IAdapter<PluginSettings>;

	constructor(plugin: Plugin, settings: IAdapter<PluginSettings>) {
		super(plugin, new FlashcardYamlEngine(plugin));
		this._settings = settings;
	}

	parseMetadata = async (filepath: string): Promise<ParseResult<FlashcardYaml>> => {
		const result = await this._yaml.extractFromFile(filepath);
		if (!result.success || !result.metadata) {
			// Try recovery
			await this._yaml.recover(filepath);
			const retryResult = await this._yaml.extractFromFile(filepath);
			if (!retryResult.success || !retryResult.metadata) {
				throw new Error('Failed to extract metadata after recovery');
			}
			return {
				entity: retryResult.metadata,
				filepath,
			};
		}
		return {
			entity: result.metadata,
			filepath,
		};
	};

	parse = async (filepath: string): Promise<ParseResult<Flashcard>> => {
		const normalizedPath = normalizePath(filepath);
		const content = await this._plugin.app.vault.adapter.read(normalizedPath);
		const result = this._yaml.extractFromContent(content);

		if (!result.success || !result.metadata) {
			await this._yaml.recover(filepath);
			Logger.warn('Recovered flashcard with default metadata:', filepath);

			const retryContent = await this._plugin.app.vault.adapter.read(normalizedPath);
			const retryResult = this._yaml.extractFromContent(retryContent);

			if (!retryResult.success || !retryResult.metadata) {
				throw new Error('impossible to recover metadata');
			}

			const splitResult = this.splitContent(retryResult.content);
			const flashcard: Flashcard = {
				...retryResult.metadata,
				front: splitResult.front,
				back: splitResult.back,
			};
			return { entity: flashcard, filepath };
		}

		const splitResult = this.splitContent(result.content);
		const flashcard: FlashcardYaml & FlashcardContent = {
			...result.metadata,
			front: splitResult.front,
			back: splitResult.back,
		};

		return { entity: flashcard, filepath };
	};

	parseAll = async (dirPath: string): Promise<ParseResult<FlashcardYaml>[]> => {
		const normalizedDir = normalizePath(dirPath);
		const dirExists = await this._plugin.app.vault.adapter.exists(normalizedDir);

		if (!dirExists) {
			return [];
		}

		const { files } = await this._plugin.app.vault.adapter.list(normalizedDir);
		const mdFiles = files.filter((f) => f.endsWith('.md'));

		const results: ParseResult<FlashcardYaml>[] = [];

		for (const file of mdFiles) {
			const result = await this.parseMetadata(file);
			results.push(result);
		}

		return results;
	};

	/**
	 * Splits the body content into front and back parts using the configured marker.
	 *
	 * @param content Full content of the markdown file (without frontmatter)
	 * @returns A ContentSplitResult containing front and back content
	 */
	private splitContent(content: string): { front: string; back: string } {
		const marker = this._settings.data.flashcard.marker;

		const markerIndex = content.indexOf(marker);

		if (markerIndex === -1) {
			throw new Error(ERROR_MESSAGES.MISSING_MARKER);
		}

		const front = content.substring(0, markerIndex).trim();
		const back = content.substring(markerIndex + marker.length).trim();

		return {
			front,
			back,
		};
	}
}
