import { IParser } from '@/interfaces/IParser';
import {
	Flashcard,
	FlashcardContent,
	FlashcardContentSchema,
	FlashcardYaml,
	FlashcardYamlSchema,
} from '@/schemas';
import { Plugin } from 'obsidian';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { BaseWriter } from './BaseWriter';

export class FlashcardWriter extends BaseWriter<Flashcard, FlashcardYaml, FlashcardContent> {
	private _parser: IParser<Flashcard, FlashcardYaml>;

	constructor(plugin: Plugin, parser: IParser<Flashcard, FlashcardYaml>) {
		super(plugin, new FlashcardYamlEngine(plugin));
		this._parser = parser;
	}

	protected serializeBody(body: FlashcardContent): string {
		const marker = this._parser.marker;
		return `${body.front}\n\n${marker}\n\n${body.back}`;
	}

	/**
	 * @throws {Error} if the content cannot be parsed
	 */
	protected deserializeBody(content: string): FlashcardContent {
		const parsed = this._parser.parseContent(content);

		if (!parsed.success) {
			throw parsed.error;
		}

		return { front: parsed.entity.front, back: parsed.entity.back };
	}

	protected extractMetadata(entity: Flashcard): FlashcardYaml {
		return FlashcardYamlSchema.parse(entity);
	}

	protected extractBody(entity: Flashcard): FlashcardContent {
		return FlashcardContentSchema.parse(entity);
	}
	protected getMetadataKeys(): string[] {
		return Object.keys(FlashcardYamlSchema.shape);
	}
}
