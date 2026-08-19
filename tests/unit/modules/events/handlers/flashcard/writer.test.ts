import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { AdapterKey } from '@/types/adapters';
import { WriterKey } from '@/types/writers';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { Logger } from '@/utils/Logger';
import { Notice } from 'obsidian';
import {
	FlashcardWriterCreateHandler,
	FlashcardWriterUpdateHandler,
	FlashcardWriterDeleteHandler,
	FlashcardWriterFmHandler,
	FlashcardWriterBodyHandler,
} from '@/modules/events/handlers/flashcard/writer';
import {
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardWriterFmResponseEvent,
	FlashcardWriterBodyRequestEvent,
	FlashcardWriterBodyResponseEvent,
} from '@/modules/events/domains/flashcard/writer';
import { CardType } from '@/schemas';

vi.mock('uuid', () => ({
	v4: vi.fn(() => 'mocked-uuid'),
}));

describe('FlashcardWriterCreateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockWriter: FlashcardWriter;
	let mockSettings: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');
		vi.spyOn(Logger, 'error').mockImplementation(() => {});

		mockWriter = {
			create: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardWriter;

		mockSettings = {
			data: {
				flashcard: {
					watch: {
						directory: '/flashcards',
					},
				},
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockSettings]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]),
			bus,
		};
	});

	it('should call writer.create and publish response on success', async () => {
		const handler = new FlashcardWriterCreateHandler(mockDeps);
		const event = new FlashcardWriterCreateRequestEvent({
			content: { meta_type: CardType.Basic, front: 'Q', back: 'A' },
			source: 'source.md',
			decks: [],
		});

		await handler.handle(event);

		expect(mockWriter.create).toHaveBeenCalledTimes(1);
		expect(mockWriter.create).toHaveBeenCalledWith(
			'/flashcards/mocked-uuid.md',
			expect.objectContaining({
				uuid: 'mocked-uuid',
				source: 'source.md',
				card_type: CardType.Basic,
				content: { meta_type: CardType.Basic, front: 'Q', back: 'A' },
			}),
		);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardWriterCreateResponseEvent),
		);
		const publishedEvent = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardWriterCreateResponseEvent;
		expect(publishedEvent.data).toEqual({
			filepath: '/flashcards/mocked-uuid.md',
		});
		expect(Notice).toHaveBeenCalledWith('Flashcard created successfully');
	});

	it('should log error and show notice on failure', async () => {
		mockWriter = {
			create: vi.fn().mockRejectedValue(new Error('fail')),
		} as unknown as FlashcardWriter;
		mockDeps = {
			...mockDeps,
			writers: new Map([[WriterKey.flashcard, mockWriter]]),
		};

		const handler = new FlashcardWriterCreateHandler(mockDeps);
		const event = new FlashcardWriterCreateRequestEvent({
			content: { meta_type: CardType.Basic, front: 'Q', back: 'A' },
			source: 'source.md',
			decks: [],
		});

		await handler.handle(event);

		expect(Logger.error).toHaveBeenCalledWith(
			'Failed to create flashcard',
			expect.any(Error),
		);
		expect(Notice).toHaveBeenCalledWith('Failed to create flashcard');
		expect(bus.publish).not.toHaveBeenCalled();
	});
});

describe('FlashcardWriterUpdateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockWriter: FlashcardWriter;
	let mockSettings: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockWriter = {
			update: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardWriter;

		mockSettings = {
			data: {
				flashcard: {
					watch: {
						directory: '/flashcards',
					},
				},
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockSettings]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]),
			bus,
		};
	});

	it('should call writer.update and publish response', async () => {
		const handler = new FlashcardWriterUpdateHandler(mockDeps);
		const event = new FlashcardWriterUpdateRequestEvent({
			uuid: 'test-uuid',
			content: { meta_type: CardType.Basic, front: 'Q', back: 'A' },
			source: 'source.md',
		});

		await handler.handle(event);

		expect(mockWriter.update).toHaveBeenCalledTimes(1);
		expect(mockWriter.update).toHaveBeenCalledWith(
			'/flashcards/test-uuid.md',
			expect.anything(),
		);
		const updatedCard = vi.mocked(mockWriter.update).mock.calls[0][1];
		expect(updatedCard).toEqual(
			expect.objectContaining({
				uuid: 'test-uuid',
				source: 'source.md',
				content: { meta_type: CardType.Basic, front: 'Q', back: 'A' },
			}),
		);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					filepath: '/flashcards/test-uuid.md',
					requestId: event.id,
					success: true,
				},
			}),
		);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardWriterUpdateResponseEvent));
	});
	it('publishes a correlated failure response when writer.update rejects', async () => {
		const loggerError = vi.spyOn(Logger, 'error').mockImplementation(() => {});
		mockWriter.update = vi.fn().mockRejectedValue(new Error('write failed'));
		const handler = new FlashcardWriterUpdateHandler(mockDeps);
		const event = new FlashcardWriterUpdateRequestEvent({ uuid: 'failed-uuid' });

		await handler.handle(event);

		expect(loggerError).toHaveBeenCalledWith('WriterUpdateEventError:', expect.any(Error));
		expect(bus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					filepath: '/flashcards/failed-uuid.md',
					requestId: event.id,
					success: false,
				},
			}),
		);
		loggerError.mockRestore();
	});
});

describe('FlashcardWriterDeleteHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockWriter: FlashcardWriter;
	let mockSettings: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockWriter = {
			delete: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardWriter;

		mockSettings = {
			data: {
				flashcard: {
					watch: {
						directory: '/flashcards',
					},
				},
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockSettings]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]),
			bus,
		};
	});

	it('should call writer.delete and publish response', async () => {
		const handler = new FlashcardWriterDeleteHandler(mockDeps);
		const event = new FlashcardWriterDeleteRequestEvent({
			uuid: 'test-uuid',
		});

		await handler.handle(event);

		expect(mockWriter.delete).toHaveBeenCalledTimes(1);
		expect(mockWriter.delete).toHaveBeenCalledWith('/flashcards/test-uuid.md');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardWriterDeleteResponseEvent),
		);
	});
});

describe('FlashcardWriterFmHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockWriter: FlashcardWriter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockWriter = {
			updateFrontmatter: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardWriter;

		mockDeps = {
			plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]),
			bus,
		};
	});

	it('should call writer.updateFrontmatter and publish response', async () => {
		const handler = new FlashcardWriterFmHandler(mockDeps);
		const event = new FlashcardWriterFmRequestEvent({
			filepath: 'test.md',
			fm: { uuid: 'test' },
		});

		await handler.handle(event);

		expect(mockWriter.updateFrontmatter).toHaveBeenCalledTimes(1);
		expect(mockWriter.updateFrontmatter).toHaveBeenCalledWith(
			'test.md',
			{ uuid: 'test' },
		);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardWriterFmResponseEvent),
		);
	});
});

describe('FlashcardWriterBodyHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockWriter: FlashcardWriter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockWriter = {
			updateBody: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardWriter;

		mockDeps = {
			plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]),
			bus,
		};
	});

	it('should call writer.updateBody and publish response', async () => {
		const handler = new FlashcardWriterBodyHandler(mockDeps);
		const event = new FlashcardWriterBodyRequestEvent({
			filepath: 'test.md',
			content: { meta_type: CardType.Basic, front: 'Q', back: 'A' },
		});

		await handler.handle(event);

		expect(mockWriter.updateBody).toHaveBeenCalledTimes(1);
		expect(mockWriter.updateBody).toHaveBeenCalledWith(
			'test.md',
			{ meta_type: CardType.Basic, front: 'Q', back: 'A' },
		);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardWriterBodyResponseEvent),
		);
	});
});
