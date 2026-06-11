import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsStore } from '@/ui/store/settings.store';
import { EventBus, SettingsAdapterStateEvent } from '@/modules/events';
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
});
