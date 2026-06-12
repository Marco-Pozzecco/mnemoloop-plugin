import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { ParserKey } from '@/types/parsers';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardParserParseAllRequestEvent,
	FlashcardParserParseAllResponseEvent,
	FlashcardParserParseContentRequestEvent,
	FlashcardParserParseContentResponseEvent,
	FlashcardParserParseMetadataRequestEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
} from '../../domains/flashcard/parsers';

export class FlashcardParserParseHandler extends EventHandler<FlashcardParserParseRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { filepath } = event.data;
		const result = await parser.parse(filepath);
		void this._bus.publish(new FlashcardParserParseResponseEvent(result));
	}
}

export class FlashcardParserParseContentHandler extends EventHandler<FlashcardParserParseContentRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async handle(event: FlashcardParserParseContentRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { content } = event.data;
		const result = parser.parseContent(content);
		void this._bus.publish(new FlashcardParserParseContentResponseEvent(result));
	}
}

export class FlashcardParserParseMetadataHandler extends EventHandler<FlashcardParserParseMetadataRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseMetadataRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { filepath } = event.data;
		const result = await parser.parseMetadata(filepath);
		void this._bus.publish(new FlashcardParserParseMetadataResponseEvent(result));
	}
}

export class FlashcardParserParseAllHandler extends EventHandler<FlashcardParserParseAllRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseAllRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard)!;
		const { dirPath } = event.data;
		const result = await parser.parseAll(dirPath);
		void this._bus.publish(new FlashcardParserParseAllResponseEvent(result));
	}
}
