import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';
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
import { Logger } from '@/utils/Logger';

export class FlashcardParserParseHandler extends EventHandler<FlashcardParserParseRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard) as FlashcardParser;
		const { filepath } = event.data;
		const result = await parser.parseFile(filepath);
		void this._bus.publish(new FlashcardParserParseResponseEvent(result));
	}
}

export class FlashcardParserParseContentHandler extends EventHandler<FlashcardParserParseContentRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseContentRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard) as FlashcardParser;
		const { content } = event.data;
		const result = parser.parseContent(content);
		if (result.success) {
			void this._bus.publish(new FlashcardParserParseContentResponseEvent(result));
			return;
		}
		Logger.error(`Error while handling ${event.type} id::${event.id}`);
	}
}

export class FlashcardParserParseMetadataHandler extends EventHandler<FlashcardParserParseMetadataRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseMetadataRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard) as FlashcardParser;
		const { filepath } = event.data;
		const rawResult = await parser.parseYaml(filepath);
		if (Array.isArray(rawResult)) return;
		const result = rawResult;
		void this._bus.publish(new FlashcardParserParseMetadataResponseEvent(result));
	}
}

export class FlashcardParserParseAllHandler extends EventHandler<FlashcardParserParseAllRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardParserParseAllRequestEvent): Promise<void> {
		const parser = this._parsers.get(ParserKey.flashcard) as FlashcardParser;
		const { dirPath } = event.data;
		const result = await parser.parseDir(dirPath);
		void this._bus.publish(new FlashcardParserParseAllResponseEvent(result));
	}
}
