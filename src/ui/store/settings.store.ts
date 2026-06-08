import {
	EventBus,
	FlashcardIndexInitializeEvent,
	SettingsAdapterResetEvent,
	SettingsAdapterSaveEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterStateEvent,
	SettingsAdapterUpdateRequestEvent,
} from '@/modules/events';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettings } from '@/schemas/settings';
import { writable, Writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

const settingsWritable = writable(DEFAULT_PLUGIN_SETTINGS);
const isLoadingStore = writable(false);
const saveErrorStore = writable<string | null>(null);
const fieldErrorsStore = writable<Record<string, string>>({});

export class SettingsStore extends BaseStoreManager<PluginSettings> {
	private _unsubscribe: () => void = () => {};

	// Public stores for direct access in Svelte components
	settings: Writable<PluginSettings>;
	isLoading: Writable<boolean>;
	saveError: Writable<string | null>;
	fieldErrors: Writable<Record<string, string>>;

	constructor() {
		super(DEFAULT_PLUGIN_SETTINGS, settingsWritable);
		this.settings = settingsWritable;
		this.isLoading = isLoadingStore;
		this.saveError = saveErrorStore;
		this.fieldErrors = fieldErrorsStore;

		const handler = (event: SettingsAdapterStateEvent) => {
			this.settings.update((state) => {
				const updated = { ...state, ...event.data };
				// If the watch config has changed, trigger a flashcard index re-initialize
				if (state.flashcard.watch !== updated.flashcard.watch) {
					EventBus.instance.publish(new FlashcardIndexInitializeEvent());
				}
				return updated;
			});
			this.saveError.update(() => null);
			this.fieldErrors.update(() => ({}));
			this.isLoading.update(() => false);
		};
		this._unsubscribe = EventBus.instance.subscribe(SettingsAdapterStateEvent, handler);
	}

	async updateField<K extends keyof PluginSettings>(
		field: K,
		value: PluginSettings[K],
	): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const request = new SettingsAdapterSetRequestEvent({ field, value });
		EventBus.instance.publish(request);
	}

	async updateNestedField(path: string[], value: unknown): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		// Get current settings and create a deep copy
		const currentSettings: PluginSettings = this.currentSettings;

		// Set value at nested path
		this.setValueAtPath(currentSettings, path, value);

		const request = new SettingsAdapterUpdateRequestEvent(currentSettings);
		EventBus.instance.publish(request);
	}

	async reset(): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const request = new SettingsAdapterResetEvent();
		EventBus.instance.publish(request);
	}

	async save(): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const request = new SettingsAdapterSaveEvent();
		EventBus.instance.publish(request);
	}

	dispose(): void {
		this._unsubscribe();
	}

	/**
	 * Get current settings value (non-reactive)
	 */
	get currentSettings(): PluginSettings {
		return this.state;
	}

	/**
	 * Sets a value at a nested path in an object
	 */
	private setValueAtPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
		let current: Record<string, unknown> = obj;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			if (!key || !(key in current) || typeof current[key] !== 'object') {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}
		const lastKey = path[path.length - 1];
		if (lastKey) {
			current[lastKey] = value;
		}
	}
}

// Singleton instance of SettingsStore
export const settingsStore = new SettingsStore();
