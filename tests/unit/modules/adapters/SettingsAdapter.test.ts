import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	AdapterAction,
	SettingsAdapterInitResponseEvent,
	SettingsAdapterSaveResponseEvent,
	SettingsAdapterResetResponseEvent,
	SettingsAdapterUpdatedResponseEvent,
	SettingsAdapterSetResponseEvent,
} from '@/modules/events';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { IEvent } from '@/interfaces/IEvent';

describe('SettingsAdapter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let adapter: SettingsAdapter;
	let capturedEvents: IEvent[];

	beforeEach(() => {
		resetSingletons();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		plugin = createMockPlugin([]);
		adapter = new SettingsAdapter(plugin as unknown as Plugin);
	});

	describe('constructor', () => {
		it('should initialize with default settings', () => {
			expect(adapter.data).toEqual(DEFAULT_PLUGIN_SETTINGS);
		});
	});

	describe('emit routing', () => {
		it('should publish Init event', () => {
			adapter.emit(AdapterAction.Init);
			const event = capturedEvents.find((e) => e.isType(SettingsAdapterInitResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Save event', () => {
			adapter.emit(AdapterAction.Save);
			const event = capturedEvents.find((e) => e.isType(SettingsAdapterSaveResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Reset event', () => {
			adapter.emit(AdapterAction.Reset);
			const event = capturedEvents.find((e) => e.isType(SettingsAdapterResetResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Update event', () => {
			adapter.emit(AdapterAction.Update);
			const event = capturedEvents.find((e) => e.isType(SettingsAdapterUpdatedResponseEvent.type));
			expect(event).toBeDefined();
		});

		it('should publish Set event', () => {
			adapter.emit(AdapterAction.Set);
			const event = capturedEvents.find((e) => e.isType(SettingsAdapterSetResponseEvent.type));
			expect(event).toBeDefined();
		});
	});

	describe('loadData', () => {
		it('should delegate to plugin.loadData', async () => {
			plugin.loadData = vi.fn().mockResolvedValue({ ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 });

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(plugin.loadData).toHaveBeenCalled();
			expect(data).toEqual(expect.objectContaining({ debounce_timeout_ms: 1000 }));
		});
	});

	describe('saveData', () => {
		it('should delegate to plugin.saveData', async () => {
			const testData = { ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 };

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData(testData);

			expect(plugin.saveData).toHaveBeenCalledWith(testData);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should initialize with loaded data from plugin', async () => {
			plugin.loadData = vi.fn().mockResolvedValue({ ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 });

			await adapter.initialize();

			expect(adapter.data.debounce_timeout_ms).toBe(1000);
			expect(capturedEvents.some((e) => e.isType(SettingsAdapterInitResponseEvent.type))).toBe(true);
		});

		it('should save data via plugin.saveData', async () => {
			adapter.set({ ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 });
			capturedEvents = [];

			await adapter.save();

			expect(plugin.saveData).toHaveBeenCalledWith(
				expect.objectContaining({ debounce_timeout_ms: 1000 }),
			);
			expect(capturedEvents.some((e) => e.isType(SettingsAdapterSaveResponseEvent.type))).toBe(true);
		});
	});
});
