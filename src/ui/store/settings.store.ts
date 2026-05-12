import { IEvent } from '@/interfaces/IEvent';
import {
	EventBus,
	SettingsAdapterInitResponseEvent,
	SettingsAdapterResetRequestEvent,
	SettingsAdapterResetResponseEvent,
	SettingsAdapterSaveRequestEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterUpdateRequestEvent,
} from '@/modules/events';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettings } from '@/schemas/settings';
import { writable, Writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

type SettingsEventCallback = (event: IEvent) => void;

const settingsWritable = writable(DEFAULT_PLUGIN_SETTINGS);
const isLoadingStore = writable(false);
const saveErrorStore = writable<string | null>(null);
const fieldErrorsStore = writable<Record<string, string>>({});

export class SettingsStore extends BaseStoreManager<PluginSettings> {
	private eventCallback: SettingsEventCallback;

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

		this.eventCallback = (event) => {
			if (event.type === SettingsAdapterInitResponseEvent.type) {
				const data = (event as SettingsAdapterInitResponseEvent).data;
				this.settings.update(() => data);
				this.isLoading.update(() => false);
				return;
			}
			if (event.type === SettingsAdapterResetResponseEvent.type) {
				const data = (event as SettingsAdapterResetResponseEvent).data;
				this.settings.update(() => data);
				this.saveError.update(() => null);
				this.fieldErrors.update(() => ({}));
				this.isLoading.update(() => false);
				return;
			}
		};
	}

	initialize(): void {
		EventBus.instance.subscribe(this.eventCallback);
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

		const request = new SettingsAdapterResetRequestEvent();
		EventBus.instance.publish(request);
	}

	async save(): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const request = new SettingsAdapterSaveRequestEvent();
		EventBus.instance.publish(request);
	}

	dispose(): void {
		EventBus.instance.unsubscribe(this.eventCallback);
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
		let current: Record<string | number, unknown> = obj;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			const nextKey = path[i + 1];
			if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
				current[key] = typeof nextKey === 'number' || !isNaN(Number(nextKey)) ? [] : {};
			}
			current = current[key] as Record<string | number, unknown>;
		}
		const lastKey = path[path.length - 1];
		current[lastKey] = value;
	}
}

// Singleton instance of SettingsStore
export const settingsStore = new SettingsStore();
