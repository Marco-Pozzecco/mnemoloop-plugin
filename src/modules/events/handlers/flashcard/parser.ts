import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { ParserKey } from '@/types/parsers';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardParserParseEvent,
	FlashcardParserParseContentEvent,
	FlashcardParserParseMetadataEvent,
	FlashcardParserParseAllEvent,
} from '../../domains/flashcard/parsers';

export class FlashcardParserParseHandler extends EventHandler<FlashcardParserParseEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { filepath } = event.data;
		await parser.parse(filepath);
	}
}

export class FlashcardParserParseContentHandler extends EventHandler<FlashcardParserParseContentEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseContentEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { content } = event.data;
		parser.parseContent(content);
	}
}

export class FlashcardParserParseMetadataHandler extends EventHandler<FlashcardParserParseMetadataEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseMetadataEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { filepath } = event.data;
		await parser.parseMetadata(filepath);
	}
}

export class FlashcardParserParseAllHandler extends EventHandler<FlashcardParserParseAllEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseAllEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { dirPath } = event.data;
		await parser.parseAll(dirPath);
	}
}
