import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { DEFAULT_STATISTICS } from '@/schemas/statistics';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	AdapterAction,
	StatisticsAdapterInitResponseEvent,
	StatisticsAdapterSaveResponseEvent,
	StatisticsAdapterResetResponseEvent,
	StatisticsAdapterUpdatedResponseEvent,
	StatisticsAdapterSetResponseEvent,
} from '@/modules/events';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { IEvent } from '@/interfaces/IEvent';

describe('StatisticsAdapter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let adapter: StatisticsAdapter;
	let capturedEvents: IEvent[];

	beforeEach(() => {
		resetSingletons();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		plugin = createMockPlugin([]);
		(plugin as unknown as Record<string, unknown>).manifest = { dir: '/test-plugin' };
		adapter = new StatisticsAdapter(plugin as unknown as Plugin);
	});

	describe('constructor', () => {
		it('should set path based on manifest dir', () => {
			const path = (adapter as unknown as Record<string, string>)._path;
			expect(path).toBe('/test-plugin/statistics.json');
		});

		it('should initialize with default statistics', () => {
			expect(adapter.data).toEqual(DEFAULT_STATISTICS);
		});
	});

	describe('emit routing', () => {
		it('should publish Init event', () => {
			adapter.emit(AdapterAction.Init);
			const event = capturedEvents.find((e) => e.isType(StatisticsAdapterInitResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Save event', () => {
			adapter.emit(AdapterAction.Save);
			const event = capturedEvents.find((e) => e.isType(StatisticsAdapterSaveResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Reset event', () => {
			adapter.emit(AdapterAction.Reset);
			const event = capturedEvents.find((e) => e.isType(StatisticsAdapterResetResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Update event', () => {
			adapter.emit(AdapterAction.Update);
			const event = capturedEvents.find((e) => e.isType(StatisticsAdapterUpdatedResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Set event', () => {
			adapter.emit(AdapterAction.Set);
			const event = capturedEvents.find((e) => e.isType(StatisticsAdapterSetResponseEvent.type));
			expect(event).toBeDefined();
		});
	});

	describe('loadData', () => {
		it('should parse existing JSON file via adapter.read', async () => {
			plugin.app.vault.adapter.read = vi.fn().mockResolvedValue('{"progress":{},"sessions":[],"flashcard":{},"updated_at":"2026-05-18T10:00:00.000Z"}');

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(plugin.app.vault.adapter.read).toHaveBeenCalledWith('/test-plugin/statistics.json');
			expect(data).toEqual(
				expect.objectContaining({
					progress: {},
					sessions: [],
				}),
			);
		});

		it('should return default data when file is empty', async () => {
			plugin.app.vault.adapter.read = vi.fn().mockResolvedValue('');

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(data).toEqual(DEFAULT_STATISTICS);
		});
	});

	describe('saveData', () => {
		it('should write to existing file', async () => {
			plugin.app.vault.adapter.exists = vi.fn().mockResolvedValue(true);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData(
				DEFAULT_STATISTICS,
			);

			expect(plugin.app.vault.adapter.write).toHaveBeenCalledWith(
				'/test-plugin/statistics.json',
				expect.any(String),
			);
		});

		it('should create new file when not exists', async () => {
			plugin.app.vault.adapter.exists = vi.fn().mockResolvedValue(false);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData(
				DEFAULT_STATISTICS,
			);

			expect(plugin.app.vault.create).toHaveBeenCalledWith(
				'/test-plugin/statistics.json',
				expect.any(String),
			);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should initialize with loaded data', async () => {
			plugin.app.vault.adapter.read = vi.fn().mockResolvedValue(
				'{"progress":{},"sessions":[],"flashcard":{},"updated_at":"2026-05-18T10:00:00.000Z"}',
			);

			await adapter.initialize();

			expect(adapter.data).toEqual(
				expect.objectContaining({
					progress: {},
					sessions: [],
				}),
			);
			expect(capturedEvents.some((e) => e.isType(StatisticsAdapterInitResponseEvent.type))).toBe(true);
		});

		it('should save data via save method', async () => {
			plugin.app.vault.adapter.exists = vi.fn().mockResolvedValue(true);
			adapter.set(DEFAULT_STATISTICS);
			capturedEvents = [];

			await adapter.save();

			expect(plugin.app.vault.adapter.write).toHaveBeenCalled();
			expect(capturedEvents.some((e) => e.isType(StatisticsAdapterSaveResponseEvent.type))).toBe(true);
		});
	});
});
