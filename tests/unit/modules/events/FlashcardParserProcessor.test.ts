import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { FlashcardParserProcessor } from '@/modules/events/processors/FlashcardParserProcessor';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { createFlashcardYaml } from '../../../helpers/factories';
import type { IParser } from '@/interfaces/IParser';
import type { Flashcard, FlashcardYaml } from '@/schemas';
import {
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardParserParseContentRequestEvent,
	FlashcardParserParseContentResponseEvent,
	FlashcardParserParseMetadataRequestEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseAllRequestEvent,
	FlashcardParserParseAllResponseEvent,
} from '@/modules/events/domains';

function createMockParser(): IParser<Flashcard, FlashcardYaml> {
	const yaml = createFlashcardYaml();
	return {
		marker: '?',
		parse: vi.fn().mockResolvedValue({ entity: { ...yaml, front: 'Front', back: 'Back' }, filepath: '/flashcards/test.md' }),
		parseContent: vi.fn().mockReturnValue({ entity: { ...yaml, front: 'Front', back: 'Back' } }),
		parseMetadata: vi.fn().mockResolvedValue({ entity: yaml, filepath: '/flashcards/test.md' }),
		parseAll: vi.fn().mockResolvedValue([
			{ entity: yaml, filepath: '/flashcards/a.md' },
			{ entity: yaml, filepath: '/flashcards/b.md' },
		]),
	} as unknown as IParser<Flashcard, FlashcardYaml>;
}

async function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('FlashcardParserProcessor', () => {
	let parser: ReturnType<typeof createMockParser>;
	let processor: FlashcardParserProcessor;
	let capturedEvents: Array<unknown>;

	beforeEach(() => {
		resetSingletons();

		parser = createMockParser();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		processor = new FlashcardParserProcessor(parser);
	});

	afterEach(() => {
		processor.dispose();
	});

	describe('event routing', () => {
		it('should route FlashcardParserParseRequestEvent to _handleParse', async () => {
			const requestEvent = new FlashcardParserParseRequestEvent({ filepath: '/flashcards/test.md' });

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(parser.parse).toHaveBeenCalledWith('/flashcards/test.md');
			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardParserParseResponseEvent);
			expect(responseEvent).toBeDefined();
			expect((responseEvent as FlashcardParserParseResponseEvent).data.filepath).toBe('/flashcards/test.md');
		});

		it('should route FlashcardParserParseContentRequestEvent to _handleParseContent', async () => {
			const requestEvent = new FlashcardParserParseContentRequestEvent({ content: '# Front\n\n?\n\nBack' });

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(parser.parseContent).toHaveBeenCalledWith('# Front\n\n?\n\nBack');
			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardParserParseContentResponseEvent);
			expect(responseEvent).toBeDefined();
		});

		it('should route FlashcardParserParseMetadataRequestEvent to _handleParseMetadata', async () => {
			const requestEvent = new FlashcardParserParseMetadataRequestEvent({ filepath: '/flashcards/test.md' });

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(parser.parseMetadata).toHaveBeenCalledWith('/flashcards/test.md');
			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardParserParseMetadataResponseEvent);
			expect(responseEvent).toBeDefined();
			expect((responseEvent as FlashcardParserParseMetadataResponseEvent).data.filepath).toBe('/flashcards/test.md');
		});

		it('should route FlashcardParserParseAllRequestEvent to _handleParseAll', async () => {
			const requestEvent = new FlashcardParserParseAllRequestEvent({ dirPath: '/flashcards' });

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(parser.parseAll).toHaveBeenCalledWith('/flashcards');
			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardParserParseAllResponseEvent);
			expect(responseEvent).toBeDefined();
			expect((responseEvent as FlashcardParserParseAllResponseEvent).data.dirPath).toBe('/flashcards');
			expect((responseEvent as FlashcardParserParseAllResponseEvent).data.entities).toHaveLength(2);
		});

		it('should ignore events not in eventTypes', async () => {
			const otherEvent = { id: 'other-1', type: 'other-event', data: {}, isType: () => false, time: new Date(), toJSON: () => ({}) };

			EventBus.instance.publish(otherEvent as unknown as Parameters<typeof EventBus.instance.publish>[0]);
			await flushPromises();

			expect(parser.parse).not.toHaveBeenCalled();
			expect(parser.parseContent).not.toHaveBeenCalled();
			expect(parser.parseMetadata).not.toHaveBeenCalled();
			expect(parser.parseAll).not.toHaveBeenCalled();
		});
	});

	describe('async publish patterns', () => {
		it('should publish parse response after async parser completes', async () => {
			let resolveParse: (value: { entity: Flashcard; filepath: string }) => void;
			parser.parse = vi.fn().mockReturnValue(
				new Promise((resolve) => {
					resolveParse = resolve;
				}),
			);

			const requestEvent = new FlashcardParserParseRequestEvent({ filepath: '/flashcards/test.md' });
			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(capturedEvents.filter((e) => e instanceof FlashcardParserParseResponseEvent)).toHaveLength(0);

			resolveParse!({ entity: { ...createFlashcardYaml(), front: 'Front', back: 'Back' } as Flashcard, filepath: '/flashcards/test.md' });
			await flushPromises();

			expect(capturedEvents.filter((e) => e instanceof FlashcardParserParseResponseEvent)).toHaveLength(1);
		});
	});

	describe('EventBus integration', () => {
		it('should auto-subscribe to EventBus on construction', async () => {
			const requestEvent = new FlashcardParserParseRequestEvent({ filepath: '/flashcards/test.md' });

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(parser.parse).toHaveBeenCalled();
		});

		it('should unsubscribe from EventBus after dispose', async () => {
			processor.dispose();

			const requestEvent = new FlashcardParserParseRequestEvent({ filepath: '/flashcards/test.md' });
			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(parser.parse).not.toHaveBeenCalled();
		});

		it('should not process its own response events', async () => {
			const requestEvent = new FlashcardParserParseRequestEvent({ filepath: '/flashcards/test.md' });

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			const responseEvents = capturedEvents.filter((e) => e instanceof FlashcardParserParseResponseEvent);
			expect(responseEvents).toHaveLength(1);

			// Response event should not trigger another parse
			expect(parser.parse).toHaveBeenCalledTimes(1);
		});
	});

	describe('parse response data', () => {
		it('should include entity and filepath in parse response', async () => {
			const yaml = createFlashcardYaml();
			parser.parse = vi.fn().mockResolvedValue({
				entity: { ...yaml, front: 'Front', back: 'Back' },
				filepath: '/flashcards/test.md',
			});

			const requestEvent = new FlashcardParserParseRequestEvent({ filepath: '/flashcards/test.md' });
			EventBus.instance.publish(requestEvent);
			await flushPromises();

			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardParserParseResponseEvent);
			expect(responseEvent).toBeDefined();
			expect((responseEvent as FlashcardParserParseResponseEvent).data.entity.front).toBe('Front');
			expect((responseEvent as FlashcardParserParseResponseEvent).data.filepath).toBe('/flashcards/test.md');
		});

		it('should include entity in parse content response', async () => {
			const yaml = createFlashcardYaml();
			parser.parseContent = vi.fn().mockReturnValue({
				entity: { ...yaml, front: 'Front', back: 'Back' },
			});

			const requestEvent = new FlashcardParserParseContentRequestEvent({ content: 'test content' });
			EventBus.instance.publish(requestEvent);
			await flushPromises();

			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardParserParseContentResponseEvent);
			expect(responseEvent).toBeDefined();
			expect((responseEvent as FlashcardParserParseContentResponseEvent).data.entity.front).toBe('Front');
		});
	});
});
