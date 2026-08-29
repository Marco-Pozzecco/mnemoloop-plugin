import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { settingsStore } from '@/ui/store/settings.store';
import {
	EventBus,
	SettingsAdapterStateEvent,
} from '@/modules/events';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';

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
		expect(get(settingsStore.fieldErrors)['source_note.watch.tags']).toContain(
			'Source note tags must start with',
		);
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
		expect(get(settingsStore.fieldErrors)['source_note.priming.difficulty_threshold']).toBe(
			'Enter a non-negative number.',
		);
		expect(get(settingsStore.isLoading)).toBe(false);
		publish.mockRestore();
	});
});
