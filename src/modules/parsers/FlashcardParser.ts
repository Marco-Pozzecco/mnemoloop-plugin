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

	get marker() {
		return this._settings.data.flashcard.marker;
	}

	parseMetadata = async (filepath: string): Promise<ParseResult<FlashcardYaml>> => {
		try {
			const metadata = await this._yaml.extractFmFromFile(filepath);
			return {
				entity: metadata,
				filepath,
			};
		} catch {
			// Try recovery
			await this._yaml.recover(filepath);
			return this.parseMetadata(filepath);
		}
	};

	parseContent: (content: string) => Omit<ParseResult<Flashcard>, 'filepath'> = (content) => {
		const result = this._yaml.extractFmFromContent(content);
		const splitResult = this.splitContent(result.body);
		const flashcard: FlashcardYaml & FlashcardContent = {
			...result.fm,
			front: splitResult.front,
			back: splitResult.back,
		};
		return { entity: flashcard };
	};

	parse = async (filepath: string): Promise<ParseResult<Flashcard>> => {
		const normalizedPath = normalizePath(filepath);
		const content = await this._plugin.app.vault.adapter.read(normalizedPath);

		try {
			const result = this._yaml.extractFmFromContent(content);
			const splitResult = this.splitContent(result.body);
			const flashcard: FlashcardYaml & FlashcardContent = {
				...result.fm,
				front: splitResult.front,
				back: splitResult.back,
			};
			return { entity: flashcard, filepath };
		} catch {
			await this._yaml.recover(filepath);
			Logger.warn('Recovered flashcard with default metadata:', filepath);

			const retryContent = await this._plugin.app.vault.adapter.read(normalizedPath);

			try {
				const retryResult = this._yaml.extractFmFromContent(retryContent);
				const splitResult = this.splitContent(retryResult.body);
				const flashcard: Flashcard = {
					...retryResult.fm,
					front: splitResult.front,
					back: splitResult.back,
				};
				return { entity: flashcard, filepath };
			} catch {
				throw new Error('impossible to recover metadata');
			}
		}
	};

	parseAll = async (dirPath: string): Promise<ParseResult<FlashcardYaml>[]> => {
		const normalizedDir = normalizePath(dirPath);
		const dirExists = await this._plugin.app.vault.adapter.exists(normalizedDir);

		if (!dirExists) {
			return [];
		}

		const { files } = await this._plugin.app.vault.adapter.list(normalizedDir);
		const mdFiles = files.filter((f) => f.endsWith('.md'));

		const promises = mdFiles.map(async (file) => {
			return await this.parseMetadata(file);
		});

		return Promise.all(promises);
	};

	/**
	 * Splits the body content into front and back parts using the configured marker.
	 *
	 * @param content Full content of the markdown file (without frontmatter)
	 * @returns A ContentSplitResult containing front and back content
	 */
	private splitContent(content: string): { front: string; back: string } {
		const marker = this._settings.data.flashcard.marker;

		// Escape special regex characters in the marker
		const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// Use regex to find marker on its own line
		const markerRegex = new RegExp(`\\n\\s*${escapedMarker}\\s*\\n`);

		const match = markerRegex.exec(content);

		if (!match || match.index === undefined) {
			throw new Error(ERROR_MESSAGES.MISSING_MARKER);
		}

		const frontEnd = match.index;
		const backStart = frontEnd + match.reduce((acc, curr) => (acc += curr.length), 0);

		const front = content.substring(0, frontEnd).trim();
		const back = content.substring(backStart).trim();

		return {
			front,
			back,
		};
	}
}
