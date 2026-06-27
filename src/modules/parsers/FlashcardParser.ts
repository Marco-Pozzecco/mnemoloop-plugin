import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult, ParseResult } from '@/interfaces/IParser';
import { Flashcard, type FlashcardContent, type FlashcardYaml } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';
import { Logger } from '@/utils/Logger';
import { normalizePath, Plugin, TFile, TFolder } from 'obsidian';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { BaseParser } from './BaseParser';
import { NotFoundError } from '@/utils/errors';

export class FlashcardParser extends BaseParser<Flashcard, FlashcardYaml> {
	private _settings: IAdapter<PluginSettings>;

	constructor(
		plugin: Plugin,
		settings: IAdapter<PluginSettings>,
		yamlEngine?: FlashcardYamlEngine,
	) {
		super(plugin, yamlEngine ?? new FlashcardYamlEngine(plugin));
		this._settings = settings;
	}

	get marker() {
		return this._settings.data.flashcard.marker;
	}

	parseMetadata = async (
		filepath: string,
		retryCount: number = 0,
	): Promise<ParseResult<FlashcardYaml>> => {
		try {
			const file = this._plugin.app.vault.getFileByPath(filepath);

			if (!file) {
				throw new NotFoundError(`File not found: ${filepath}`);
			}

			const metadata = await this._yaml.extractFmFromFile(filepath);

			return {
				entity: metadata,
				stats: {
					created_at: new Date(file.stat.ctime).toISOString(),
					updated_at: new Date(file.stat.mtime).toISOString(),
				},
				filepath,
				success: true,
			};
		} catch (e) {
			if (e instanceof NotFoundError) {
				Logger.error(e.message);
				return {
					entity: null,
					stats: null,
					filepath,
					success: false,
					error: e,
				};
			}
			if (retryCount >= 1) {
				const error = new Error(
					`parseMetadata: failed after ${retryCount} retries for ${filepath}`,
				);
				Logger.error(error.message);
				return {
					entity: null,
					stats: null,
					filepath,
					success: false,
					error,
				};
			}
			await this._yaml.recover(filepath);
			return this.parseMetadata(filepath, retryCount + 1);
		}
	};

	parseContent: (content: string) => ParseContentResult<Flashcard> = (content) => {
		try {
			const result = this._yaml.extractFmFromContent(content);
			const splitResult = this.splitContent(result.body);

			if (splitResult.front === null || splitResult.back === null) {
				throw new Error('no content found');
			}

			const flashcard: FlashcardYaml & FlashcardContent = {
				...result.fm,
				front: splitResult.front,
				back: splitResult.back,
			};

			return { entity: flashcard, success: true };
		} catch (error) {
			return {
				entity: null,
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	};

	parse = async (filepath: string, retryCount: number = 0): Promise<ParseResult<Flashcard>> => {
		const normalizedPath = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalizedPath);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${normalizedPath}`);
		}
		const content = await this._plugin.app.vault.read(file);

		try {
			const result = this._yaml.extractFmFromContent(content);
			const splitResult = this.splitContent(result.body);

			if (splitResult.front === null || splitResult.back === null) {
				throw new Error('no content found');
			}

			const flashcard: FlashcardYaml & FlashcardContent = {
				...result.fm,
				front: splitResult.front,
				back: splitResult.back,
			};

			return {
				entity: flashcard,
				filepath,
				stats: {
					created_at: new Date(file.stat.ctime).toISOString(),
					updated_at: new Date(file.stat.mtime).toISOString(),
				},
				success: true,
			};
		} catch {
			if (retryCount >= 2) {
				const error = new Error(`parse: failed after ${retryCount} retries for ${filepath}`);
				Logger.error(error.message);

				return {
					entity: null,
					filepath,
					stats: null,
					success: false,
					error,
				};
			}
			await this._yaml.recover(filepath);
			return this.parse(filepath, retryCount + 1);
		}
	};

	parseAll = async (dirPath: string): Promise<ParseResult<FlashcardYaml>[]> => {
		const normalizedDir = normalizePath(dirPath);
		const folder = this._plugin.app.vault.getAbstractFileByPath(normalizedDir);

		if (!(folder instanceof TFolder)) {
			return [];
		}

		const mdFiles = folder.children.filter(
			(f): f is TFile => f instanceof TFile && f.extension === 'md',
		);

		const promises = mdFiles.map(async (file) => {
			const result = (await this.parse(file.path)) as ParseResult<FlashcardYaml>;
			result.entity = result.entity ? this._yaml.validate(result.entity) : null;
			return result;
		});

		return await Promise.all(promises);
	};

	/**
	 * Splits the body content into front and back parts using the configured marker.
	 *
	 * @param content Full content of the markdown file (without frontmatter)
	 * @returns A ContentSplitResult containing front and back content
	 */
	private splitContent(content: string): { front: string | null; back: string | null } {
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
			front: front.length > 0 ? front : null,
			back: back.length > 0 ? back : null,
		};
	}
}
