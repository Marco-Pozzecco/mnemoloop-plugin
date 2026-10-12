import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { SETTINGS_COMMIT_TIMEOUT_MS, settingsStore } from '@/ui/store/settings.store';
import {
	EventBus,
	FlashcardIndexInitEvent,
	SettingsAdapterStateEvent,
	SettingsAdapterUpdateRequestEvent,
} from '@/modules/events';
import { DEFAULT_PLUGIN_SETTINGS, type PluginSettings } from '@/schemas/settings';

describe('SettingsStore', () => {
	beforeEach(() => {
		settingsStore.settings.set(DEFAULT_PLUGIN_SETTINGS);
	});

	it('updateNestedField should not mutate the original store state', async () => {
		const original = settingsStore.currentSettings;
		const originalRetention = original.flashcard.fsrs.request_retention;

		await settingsStore.updateNestedField(['flashcard', 'fsrs', 'request_retention'], 0.99);

		expect(settingsStore.currentSettings).toBe(original);
		expect(original.flashcard.fsrs.request_retention).toBe(originalRetention);
	});

	it('settings store should update after SettingsAdapterStateEvent', async () => {
		const mockSettings = {
			...DEFAULT_PLUGIN_SETTINGS,
			flashcard: {
				...DEFAULT_PLUGIN_SETTINGS.flashcard,
				fsrs: {
					...DEFAULT_PLUGIN_SETTINGS.flashcard.fsrs,
					request_retention: 0.99,
				},
			},
		};

		const listener = vi.fn();
		const unsubscribe = settingsStore.settings.subscribe(listener);

		// Clear the initial call from subscribe
		listener.mockClear();

		EventBus.instance.publish(new SettingsAdapterStateEvent(mockSettings));

		expect(listener).toHaveBeenCalledWith(mockSettings);
		unsubscribe();
	});

	it('publishes a valid source-note nested update', async () => {
		const publish = vi.spyOn(EventBus.instance, 'publish').mockResolvedValue('request-id');

		const updated = await settingsStore.updateNestedField(
			['source_note', 'watch', 'directory'],
			' /notes ',
		);

		expect(updated).toBe(true);
		expect(publish).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					source_note: expect.objectContaining({
						watch: expect.objectContaining({ directory: '/notes' }),
					}),
				}),
			}),
		);
		publish.mockRestore();
	});

	it('publishes a valid decimal priming threshold update', async () => {
		const publish = vi.spyOn(EventBus.instance, 'publish').mockResolvedValue('request-id');

		const updated = await settingsStore.updateNestedField(
			['source_note', 'priming', 'difficulty_threshold'],
			8.4,
		);

		expect(updated).toBe(true);
		expect(publish).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					source_note: expect.objectContaining({
						priming: { difficulty_threshold: 8.4 },
					}),
				}),
			}),
		);
		publish.mockRestore();
	});


	it('rejects invalid source-note nested updates without publishing', async () => {
		const publish = vi.spyOn(EventBus.instance, 'publish').mockResolvedValue('request-id');

		const updated = await settingsStore.updateNestedField(
			['source_note', 'watch', 'tags'],
			['#biology', 'biology'],
		);

		expect(updated).toBe(false);
		expect(publish).not.toHaveBeenCalled();
		expect(get(settingsStore.saveError)).toContain('Source note tags must start with');
		expect(get(settingsStore.isLoading)).toBe(false);
		publish.mockRestore();
	});

	it('rejects invalid priming thresholds without publishing', async () => {
		const publish = vi.spyOn(EventBus.instance, 'publish').mockResolvedValue('request-id');

		const updated = await settingsStore.updateNestedField(
			['source_note', 'priming', 'difficulty_threshold'],
			NaN,
		);

		expect(updated).toBe(false);
		expect(publish).not.toHaveBeenCalled();
		expect(get(settingsStore.saveError)).toBe('Enter a non-negative number.');
		expect(get(settingsStore.isLoading)).toBe(false);
		publish.mockRestore();
	});

	describe('commitPath', () => {
		afterEach(() => {
			vi.useRealTimers();
			vi.restoreAllMocks();
		});

		/** Simulates the adapter pipeline: a state event follows the update request. */
		function respondToUpdates(): void {
			const bus = EventBus.instance;
			const originalPublish = bus.publish.bind(bus);
			vi.spyOn(bus, 'publish').mockImplementation(async (event) => {
				if (event instanceof SettingsAdapterUpdateRequestEvent) {
					await originalPublish(new SettingsAdapterStateEvent(event.data as PluginSettings));
				}
				return event.id;
			});
		}

		it('persists a nested value and resolves once the state event arrives', async () => {
			respondToUpdates();

			await expect(
				settingsStore.commitPath('flashcard.fsrs.request_retention', 0.95),
			).resolves.toBeUndefined();

			expect(settingsStore.currentSettings.flashcard.fsrs.request_retention).toBe(0.95);
			expect(get(settingsStore.saveError)).toBeNull();
			expect(get(settingsStore.isLoading)).toBe(false);
		});

		it('does not mutate the previously current settings object', async () => {
			respondToUpdates();
			const original = settingsStore.currentSettings;

			await settingsStore.commitPath('flashcard.fsrs.request_retention', 0.95);

			expect(original.flashcard.fsrs.request_retention).toBe(0.9);
			expect(settingsStore.currentSettings).not.toBe(original);
		});

		it('publishes the full nested settings with the patched path', async () => {
			const bus = EventBus.instance;
			respondToUpdates();
			const publish = vi.mocked(bus.publish);

			await settingsStore.commitPath('source_note.priming.difficulty_threshold', 8.4);

			expect(publish).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						source_note: expect.objectContaining({
							priming: { difficulty_threshold: 8.4 },
						}),
					}),
				}),
			);
		});

		it('rejects invalid input, records the error, and does not publish', async () => {
			const publish = vi.spyOn(EventBus.instance, 'publish').mockResolvedValue('request-id');

			await expect(
				settingsStore.commitPath('source_note.watch.tags', ['biology']),
			).rejects.toThrow(/must start with/i);

			expect(publish).not.toHaveBeenCalled();
			expect(get(settingsStore.saveError)).toContain('must start with');
			expect(get(settingsStore.isLoading)).toBe(false);
		});

		it('triggers a flashcard index re-initialize when the watch directory changes', async () => {
			respondToUpdates();
			const publish = vi.mocked(EventBus.instance.publish);

			await settingsStore.commitPath('flashcard.watch.directory', '/other');

			expect(publish).toHaveBeenCalledWith(expect.any(FlashcardIndexInitEvent));
		});

		it('rejects when no state event arrives before the timeout', async () => {
			vi.useFakeTimers();
			vi.spyOn(EventBus.instance, 'publish').mockResolvedValue('request-id');

			const pending = settingsStore.commitPath('flashcard.marker', '!');
			const assertion = expect(pending).rejects.toThrow(/timed out/i);
			await vi.advanceTimersByTimeAsync(SETTINGS_COMMIT_TIMEOUT_MS + 10);

			await assertion;
			expect(get(settingsStore.saveError)).toMatch(/timed out/i);
		});
	});
});
