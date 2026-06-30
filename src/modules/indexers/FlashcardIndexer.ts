import { IAdapter } from '@/interfaces/IAdapter';
import { Flashcard, FlashcardIndex, FlashcardMetadata, FlashcardYaml } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { normalizePath } from 'obsidian';
import { FlashcardAdapter } from '../adapters/FlashcardAdapter';
import { FlashcardParser } from '../parsers/FlashcardParser';
import { BaseIndexer } from './BaseIndexer';

export class FlashcardIndexer extends BaseIndexer<
	Flashcard,
	FlashcardMetadata,
	FlashcardYaml,
	FlashcardIndex
> {
	private _dirPath = () => this._settings.data.flashcard.watch.directory;

	constructor(
		parser: FlashcardParser,
		adapter: FlashcardAdapter,
		settings: IAdapter<PluginSettings>,
	) {
		super(parser, settings, adapter);
	}

	initialize: () => Promise<void> = async () => {
		this._cache.clear();

		// load from adpater
		const metadata = this._adapter.data;

		for (const flashcard of metadata.flashcards) {
			if (!this.isPathInWatchedDir(flashcard.file)) continue;
			this._cache.set(flashcard.uuid, flashcard);
		}

		// parse new flashcards
		const flashcards = await this._parser.parseAll(this._dirPath());

		for (const flashcard of flashcards) {
			if (flashcard.success) {
				const metadata = this.generateMetadata(
					flashcard.entity,
					flashcard.filepath,
					flashcard.stats,
				);
				this._cache.set(flashcard.entity.uuid, metadata);
			}
		}

		await this.save();
	};

	save: () => Promise<void> = async () => {
		const flashcards = Object.values(this._cache.dump());

		this._adapter.update({
			flashcards,
			updated_at: new Date().toISOString(),
		});

		await this._adapter.save();
	};

	public findByFilepath(filepath: string): { uuid: string; entity: FlashcardMetadata } | undefined {
		const normalizedPath = normalizePath(filepath);
		for (const [uuid, entity] of Object.entries(this._cache.dump())) {
			if (normalizePath(entity.file) === normalizedPath) {
				return { uuid, entity };
			}
		}
		return undefined;
	}

	public isPathInWatchedDir(filepath: string): boolean {
		const normalizedPath = normalizePath(filepath);
		const parentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';
		const watchedDir = normalizePath(this._dirPath());
		return parentDir === watchedDir;
	}

	public generateMetadata(
		data: FlashcardYaml,
		filepath: string,
		time?: { created_at: string; updated_at: string },
	): FlashcardMetadata {
		const now = new Date().toISOString();

		const metadata: FlashcardMetadata = {
			...data,
			file: filepath,
			created_at: time?.created_at ?? now,
			updated_at: time?.updated_at ?? now,
		};
		return metadata;
	}
}
