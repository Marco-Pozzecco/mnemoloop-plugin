import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { ParserKey } from '@/types/parsers';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardParser } from '@/modules/parsers/FlashcardParser';
import {
	FlashcardParserParseHandler,
	FlashcardParserParseContentHandler,
	FlashcardParserParseMetadataHandler,
	FlashcardParserParseAllHandler,
} from '@/modules/events/handlers/flashcard/parser';
import {
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardParserParseContentRequestEvent,
	FlashcardParserParseContentResponseEvent,
	FlashcardParserParseMetadataRequestEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseAllRequestEvent,
	FlashcardParserParseAllResponseEvent,
} from '@/modules/events/domains/flashcard/parsers';

describe('FlashcardParserParseHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockParser: FlashcardParser;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockParser = {
			parse: vi.fn().mockResolvedValue({ entity: { uuid: 'test' }, filepath: 'test.md' }),
		} as unknown as FlashcardParser;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	it('should call parser.parse() and publish FlashcardParserParseResponseEvent', async () => {
		const handler = new FlashcardParserParseHandler(mockDeps);
		const event = new FlashcardParserParseRequestEvent({ filepath: 'test.md' });

		await handler.handle(event);

		expect(mockParser.parse).toHaveBeenCalledTimes(1);
		expect(mockParser.parse).toHaveBeenCalledWith('test.md');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardParserParseResponseEvent));
	});
});

describe('FlashcardParserParseContentHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockParser: FlashcardParser;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockParser = {
			parseContent: vi.fn().mockReturnValue({ entity: { uuid: 'test' } }),
		} as unknown as FlashcardParser;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	it('should call parser.parseContent() and publish FlashcardParserParseContentResponseEvent', async () => {
		const handler = new FlashcardParserParseContentHandler(mockDeps);
		const event = new FlashcardParserParseContentRequestEvent({ content: 'test' });

		await handler.handle(event);

		expect(mockParser.parseContent).toHaveBeenCalledTimes(1);
		expect(mockParser.parseContent).toHaveBeenCalledWith('test');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardParserParseContentResponseEvent));
	});
});

describe('FlashcardParserParseMetadataHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockParser: FlashcardParser;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockParser = {
			parseMetadata: vi.fn().mockResolvedValue({ entity: { uuid: 'test' }, filepath: 'test.md' }),
		} as unknown as FlashcardParser;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	it('should call parser.parseMetadata() and publish FlashcardParserParseMetadataResponseEvent', async () => {
		const handler = new FlashcardParserParseMetadataHandler(mockDeps);
		const event = new FlashcardParserParseMetadataRequestEvent({ filepath: 'test.md' });

		await handler.handle(event);

		expect(mockParser.parseMetadata).toHaveBeenCalledTimes(1);
		expect(mockParser.parseMetadata).toHaveBeenCalledWith('test.md');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardParserParseMetadataResponseEvent));
	});
});

describe('FlashcardParserParseAllHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockParser: FlashcardParser;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockParser = {
			parseAll: vi.fn().mockResolvedValue([{ entity: { uuid: 'test' }, filepath: 'test.md' }]),
		} as unknown as FlashcardParser;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	it('should call parser.parseAll() and publish FlashcardParserParseAllResponseEvent', async () => {
		const handler = new FlashcardParserParseAllHandler(mockDeps);
		const event = new FlashcardParserParseAllRequestEvent({ dirPath: '/flashcards' });

		await handler.handle(event);

		expect(mockParser.parseAll).toHaveBeenCalledTimes(1);
		expect(mockParser.parseAll).toHaveBeenCalledWith('/flashcards');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardParserParseAllResponseEvent));
	});
});
