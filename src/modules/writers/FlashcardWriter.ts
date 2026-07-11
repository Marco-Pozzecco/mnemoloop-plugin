import { IEntityParser } from '@/interfaces/parser/IEntityParser';
import {
	Flashcard,
	FlashcardContent,
	FlashcardContentSchema,
	FlashcardYaml,
	FlashcardYamlSchema,
} from '@/schemas';
import { Plugin } from 'obsidian';
import { BaseWriter } from './BaseWriter';

export class FlashcardWriter extends BaseWriter<Flashcard, FlashcardYaml, FlashcardContent> {
	constructor(plugin: Plugin, parser: IEntityParser<Flashcard, FlashcardYaml, FlashcardContent>) {
		super(plugin, parser);
	}

	protected extractMetadata(entity: Flashcard): FlashcardYaml {
		return FlashcardYamlSchema.parse(entity);
	}

	protected extractBody(entity: Flashcard): FlashcardContent {
		return FlashcardContentSchema.parse(entity.content);
	}

	protected getMetadataKeys(): string[] {
		return Object.keys(FlashcardYamlSchema.shape);
	}
}
