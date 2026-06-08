import { IAdapter } from '@/interfaces/IAdapter';
import { ParseResult } from '@/interfaces/IParser';
import {
	Flashcard,
	FlashcardIndex,
	FlashcardMetadata,
	FlashcardMetadataSchema,
	FlashcardYaml,
} from '@/schemas';
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

		const flashcards = await this._parser.parseAll(this._dirPath());

		for (const flashcard of flashcards) {
			const metadata = this.generateMetadata(flashcard);
			this._cache.set(flashcard.entity.uuid, metadata);
		}

		await this.save();
	};

	save: () => Promise<void> = async () => {
		const flashcards = Object.values(this._cache.dump());

		this._adapter.set({
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

	public generateMetadata(data: ParseResult<FlashcardYaml>): FlashcardMetadata {
		const now = new Date().toISOString();
		const entity = data.entity as Record<string, unknown>;
		const metadata = FlashcardMetadataSchema.parse({
			...entity,
			file: data.filepath,
			created_at: entity.created_at ?? now,
			updated_at: entity.updated_at ?? now,
			deleted_at: entity.deleted_at ?? null,
		});
		return metadata;
	}
}
