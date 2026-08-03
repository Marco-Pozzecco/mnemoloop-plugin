import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { ParserKey } from '@/types/parsers';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';
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
			parseFile: vi.fn().mockResolvedValue({ entity: { uuid: 'test' }, stats: { created_at: '', updated_at: '' }, filepath: 'test.md', success: true }),
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

		expect(mockParser.parseFile).toHaveBeenCalledTimes(1);
		expect(mockParser.parseFile).toHaveBeenCalledWith('test.md');
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
			parseContent: vi.fn().mockReturnValue({ entity: { uuid: 'test' }, success: true }),
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
			parseYaml: vi.fn().mockResolvedValue({ entity: { uuid: 'test' }, stats: { created_at: '', updated_at: '' }, filepath: 'test.md', success: true }),
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

		expect(mockParser.parseYaml).toHaveBeenCalledTimes(1);
		expect(mockParser.parseYaml).toHaveBeenCalledWith('test.md');
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
			parseDir: vi.fn().mockResolvedValue([{ entity: { uuid: 'test' }, stats: { created_at: '', updated_at: '' }, filepath: 'test.md', success: true }]),
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

		expect(mockParser.parseDir).toHaveBeenCalledTimes(1);
		expect(mockParser.parseDir).toHaveBeenCalledWith('/flashcards');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardParserParseAllResponseEvent));
	});
});
