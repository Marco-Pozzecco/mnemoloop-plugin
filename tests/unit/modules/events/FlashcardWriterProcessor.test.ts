import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Notice } from 'obsidian';
import { FlashcardWriterProcessor } from '@/modules/events/processors/FlashcardWriterProcessor';
import { EventBus } from '@/modules/events/core/EventBus';
import { Logger } from '@/utils/Logger';
import { resetSingletons } from '../../../helpers/reset-singletons';
import type { IWriter } from '@/interfaces/IWriter';
import type { IAdapter } from '@/interfaces/IAdapter';
import type { Flashcard, FlashcardYaml, FlashcardContent } from '@/schemas';
import { DEFAULT_PLUGIN_SETTINGS, type PluginSettings } from '@/schemas/settings';
import {
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardReviewSessionScoreEvent,
} from '@/modules/events/domains';

function createMockWriter(): IWriter<Flashcard, FlashcardYaml, FlashcardContent> {
	return {
		create: vi.fn().mockResolvedValue(undefined),
		update: vi.fn().mockResolvedValue(undefined),
		updateFrontmatter: vi.fn().mockResolvedValue(undefined),
		updateBody: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as IWriter<Flashcard, FlashcardYaml, FlashcardContent>;
}

function createMockSettingsAdapter(overrides: Partial<PluginSettings> = {}): IAdapter<PluginSettings> {
	const settings: PluginSettings = {
		...DEFAULT_PLUGIN_SETTINGS,
		...overrides,
	};
	return {
		data: settings,
		set: vi.fn(),
		setField: vi.fn(),
		update: vi.fn(),
		save: vi.fn().mockResolvedValue(undefined),
		reset: vi.fn().mockResolvedValue(undefined),
		initialize: vi.fn().mockResolvedValue(undefined),
	} as unknown as IAdapter<PluginSettings>;
}

async function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('FlashcardWriterProcessor', () => {
	let writer: ReturnType<typeof createMockWriter>;
	let settingsAdapter: IAdapter<PluginSettings>;
	let processor: FlashcardWriterProcessor;
	let capturedEvents: Array<unknown>;
	let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		resetSingletons();

		writer = createMockWriter();
		settingsAdapter = createMockSettingsAdapter();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		loggerErrorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});

		processor = new FlashcardWriterProcessor(writer, settingsAdapter);
	});

	afterEach(() => {
		processor.dispose();
		loggerErrorSpy.mockRestore();
	});

	describe('event routing', () => {
		it('should route FlashcardWriterCreateRequestEvent to _handleCreate', async () => {
			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front text',
				back: 'Back text',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(writer.create).toHaveBeenCalledTimes(1);
			const createCall = (writer.create as ReturnType<typeof vi.fn>).mock.calls[0];
			expect(createCall[0]).toMatch(/^\/flashcards\/.*\.md$/);
			expect(createCall[1]).toMatchObject({
				front: 'Front text',
				back: 'Back text',
				source: '[[source.md]]',
			});
		});

		it('should route FlashcardWriterFmRequestEvent to _handleUpdateFm', async () => {
			const requestEvent = new FlashcardWriterFmRequestEvent({
				filepath: '/flashcards/test.md',
				fm: { uuid: 'test-uuid' },
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(writer.updateFrontmatter).toHaveBeenCalledWith('/flashcards/test.md', { uuid: 'test-uuid' });
		});

		it('should route FlashcardReviewSessionScoreEvent to _handleReview', async () => {
			const requestEvent = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 4,
				difficulty: 3,
				due: new Date().toISOString(),
				last_review: new Date().toISOString(),
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(writer.updateFrontmatter).toHaveBeenCalledWith('/flashcards/test.md', expect.objectContaining({
				rating: 4,
				difficulty: 3,
			}));
		});
	});

	describe('_handleCreate', () => {
		it('should generate UUID for new flashcard', async () => {
			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			const createCall = (writer.create as ReturnType<typeof vi.fn>).mock.calls[0];
			const entity = createCall[1];
			expect(entity.uuid).toBeDefined();
			expect(entity.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('should publish FlashcardWriterCreateResponseEvent on success', async () => {
			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardWriterCreateResponseEvent);
			expect(responseEvent).toBeDefined();
			expect((responseEvent as FlashcardWriterCreateResponseEvent).data.source).toBe('source.md');
			expect((responseEvent as FlashcardWriterCreateResponseEvent).data.filepath).toMatch(/^\/flashcards\/.*\.md$/);
			expect((responseEvent as FlashcardWriterCreateResponseEvent).data.request_id).toBe(requestEvent.id);
		});

		it('should show success Notice on create', async () => {
			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(Notice).toHaveBeenCalledWith('Flashcard created successfully');
		});
	});

	describe('error handling', () => {
		it('should show error Notice when writer.create fails', async () => {
			writer.create = vi.fn().mockRejectedValue(new Error('Write failed'));

			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(Notice).toHaveBeenCalledWith('Failed to create flashcard');
		});

		it('should log error via Logger when writer.create fails', async () => {
			const error = new Error('Write failed');
			writer.create = vi.fn().mockRejectedValue(error);

			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(Logger.error).toHaveBeenCalledWith(
				expect.stringContaining('Failed to create flashcard'),
				expect.anything(),
			);
		});

		it('should not publish response event on create failure', async () => {
			writer.create = vi.fn().mockRejectedValue(new Error('Write failed'));

			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			const responseEvent = capturedEvents.find((e) => e instanceof FlashcardWriterCreateResponseEvent);
			expect(responseEvent).toBeUndefined();
		});
	});

	describe('EventBus integration', () => {
		it('should auto-subscribe to EventBus on construction', async () => {
			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(writer.create).toHaveBeenCalled();
		});

		it('should unsubscribe from EventBus after dispose', async () => {
			processor.dispose();

			const requestEvent = new FlashcardWriterCreateRequestEvent({
				front: 'Front',
				back: 'Back',
				source: 'source.md',
			});

			EventBus.instance.publish(requestEvent);
			await flushPromises();

			expect(writer.create).not.toHaveBeenCalled();
		});
	});
});
