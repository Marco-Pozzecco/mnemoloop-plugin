import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin, TFile } from 'obsidian';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { DEFAULT_FLASHCARD_INDEX } from '@/schemas';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	AdapterAction,
	FlashcardAdapterInitResponseEvent,
	FlashcardAdapterSaveResponseEvent,
	FlashcardAdapterResetResponseEvent,
	FlashcardAdapterUpdatedResponseEvent,
	FlashcardAdapterSetResponseEvent,
} from '@/modules/events';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { IEvent } from '@/interfaces/IEvent';

describe('FlashcardAdapter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let adapter: FlashcardAdapter;
	let capturedEvents: IEvent[];

	beforeEach(() => {
		resetSingletons();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		plugin = createMockPlugin([]);
		(plugin as unknown as Record<string, unknown>).manifest = { dir: '/test-plugin' };
		adapter = new FlashcardAdapter(plugin as unknown as Plugin);
	});

	describe('constructor', () => {
		it('should set path based on manifest dir', () => {
			const path = (adapter as unknown as Record<string, string>)._path;
			expect(path).toBe('/test-plugin/flashcard-index.json');
		});

		it('should initialize with default data', () => {
			expect(adapter.data).toEqual(DEFAULT_FLASHCARD_INDEX);
		});
	});

	describe('emit routing', () => {
		it('should publish Init event', () => {
			adapter.emit(AdapterAction.Init);
			const event = capturedEvents.find((e) => e.isType(FlashcardAdapterInitResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Save event', () => {
			adapter.emit(AdapterAction.Save);
			const event = capturedEvents.find((e) => e.isType(FlashcardAdapterSaveResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Reset event', () => {
			adapter.emit(AdapterAction.Reset);
			const event = capturedEvents.find((e) => e.isType(FlashcardAdapterResetResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Update event', () => {
			adapter.emit(AdapterAction.Update);
			const event = capturedEvents.find((e) => e.isType(FlashcardAdapterUpdatedResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Set event', () => {
			adapter.emit(AdapterAction.Set);
			const event = capturedEvents.find((e) => e.isType(FlashcardAdapterSetResponseEvent.type));
			expect(event).toBeDefined();
		});
	});

	describe('loadData', () => {
		it('should parse existing JSON file via vault.read', async () => {
			plugin.app.vault.getAbstractFileByPath = vi
				.fn()
				.mockReturnValue(new TFile('/test-plugin/flashcard-index.json'));
			plugin.app.vault.read = vi.fn().mockResolvedValue('{"flashcards":[],"updated_at":null}');

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(data).toEqual({ flashcards: [], updated_at: null });
		});

		it('should return default data when file not found', async () => {
			plugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(data).toEqual(DEFAULT_FLASHCARD_INDEX);
		});
	});

	describe('saveData', () => {
		it('should write to existing file', async () => {
			plugin.app.vault.adapter.exists = vi.fn().mockResolvedValue(true);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData({
				flashcards: [],
				updated_at: null,
			});

			expect(plugin.app.vault.adapter.write).toHaveBeenCalledWith(
				'/test-plugin/flashcard-index.json',
				expect.any(String),
			);
		});

		it('should create new file when not exists', async () => {
			plugin.app.vault.adapter.exists = vi.fn().mockResolvedValue(false);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData({
				flashcards: [],
				updated_at: null,
			});

			expect(plugin.app.vault.create).toHaveBeenCalledWith(
				'/test-plugin/flashcard-index.json',
				expect.any(String),
			);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should initialize with loaded data', async () => {
			plugin.app.vault.getAbstractFileByPath = vi
				.fn()
				.mockReturnValue(new TFile('/test-plugin/flashcard-index.json'));
			plugin.app.vault.read = vi.fn().mockResolvedValue('{"flashcards":[],"updated_at":null}');

			await adapter.initialize();

			expect(adapter.data).toEqual({ flashcards: [], updated_at: null });
			expect(capturedEvents.some((e) => e.isType(FlashcardAdapterInitResponseEvent.type))).toBe(
				true,
			);
		});

		it('should save data via save method', async () => {
			plugin.app.vault.adapter.exists = vi.fn().mockResolvedValue(true);
			adapter.set({ flashcards: [], updated_at: null });
			capturedEvents = [];

			await adapter.save();

			expect(plugin.app.vault.adapter.write).toHaveBeenCalled();
			expect(capturedEvents.some((e) => e.isType(FlashcardAdapterSaveResponseEvent.type))).toBe(
				true,
			);
		});
	});
});
