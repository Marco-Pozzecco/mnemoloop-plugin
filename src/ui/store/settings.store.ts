import { PluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import { writable, Writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';
import { EventBus } from '@/modules/event-bus/EventBus';
import { EventData } from '@/types/events';
import { AdapterSettingsEvents, AdapterEventType } from '@/types/adapters';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { ZodError } from 'zod';
import { Logger } from '@/utils/Logger';

type SettingsEventCallback = (event: EventData<unknown>) => void;

const settingsWritable = writable(DEFAULT_PLUGIN_SETTINGS);
const isLoadingStore = writable(false);
const saveErrorStore = writable<string | null>(null);
const fieldErrorsStore = writable<Record<string, string>>({});

export class SettingsStore extends BaseStoreManager<PluginSettings> {
	private eventCallback: SettingsEventCallback;
	private adapter: SettingsAdapter | null = null;
	private pendingSave: (() => Promise<void>) | null = null;

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

		this.eventCallback = (event: EventData<unknown>) => {
			switch (event.event_type) {
				case AdapterEventType.AdapterSettingsInit:
				case AdapterEventType.AdapterSettingsSet:
				case AdapterEventType.AdapterSettingsUpdate:
				case AdapterEventType.AdapterSettingsSave:
				case AdapterEventType.AdapterSettingsReset: {
					const data = (event as AdapterSettingsEvents['init']).data;
					settingsWritable.update(() => data.settings);
					this.saveError.update(() => null);
					this.fieldErrors.update(() => ({}));
					this.isLoading.update(() => false);
					break;
				}
			}
		};
	}

	initialize(adapter?: SettingsAdapter): void {
		if (adapter) {
			this.adapter = adapter;
		}
		EventBus.instance.subscribe(this.eventCallback);
	}

	async updateField<K extends keyof PluginSettings>(
		field: K,
		value: PluginSettings[K],
	): Promise<void> {
		if (!this.adapter) {
			Logger.error('SettingsStore: No adapter set, cannot update field');
			return;
		}

		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		// Store the save operation for potential retry
		this.pendingSave = async () => {
			this.adapter!.setField(field, value);
			await this.adapter!.save();
		};

		try {
			await this.pendingSave();
			this.fieldErrors.update(() => ({}));
		} catch (error) {
			this.handleSaveError(error);
		} finally {
			this.isLoading.update(() => false);
		}
	}

	async updateNestedField(path: string[], value: unknown): Promise<void> {
		if (!this.adapter) {
			Logger.error('SettingsStore: No adapter set, cannot update nested field');
			return;
		}

		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		// Get current settings and create a deep copy
		let currentSettings: PluginSettings;
		settingsWritable.subscribe((s) => {
			currentSettings = JSON.parse(JSON.stringify(s));
		})();

		// Set value at nested path
		this.setValueAtPath(currentSettings!, path, value);
		Logger.info('data:', path, value);
		Logger.info('updated settings:', this.currentSettings);

		// Store the save operation for potential retry
		this.pendingSave = async () => {
			// Validate using schema and update via adapter
			this.adapter!.update(currentSettings! as Partial<PluginSettings>);
			await this.adapter!.save();
		};

		try {
			await this.pendingSave();
			this.fieldErrors.update(() => ({}));
		} catch (error) {
			this.handleSaveError(error);
		} finally {
			this.isLoading.update(() => false);
		}
	}

	async reset(): Promise<void> {
		if (!this.adapter) {
			Logger.error('SettingsStore: No adapter set, cannot reset');
			return;
		}

		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		try {
			await this.adapter.reset();
			this.fieldErrors.update(() => ({}));
		} catch (error) {
			this.handleSaveError(error);
		} finally {
			this.isLoading.update(() => false);
		}
	}

	async retrySave(): Promise<void> {
		if (!this.adapter) {
			Logger.error('SettingsStore: No adapter set, cannot retry');
			return;
		}

		if (this.pendingSave) {
			this.isLoading.update(() => true);
			this.saveError.update(() => null);

			try {
				await this.pendingSave();
				this.pendingSave = null;
				this.fieldErrors.update(() => ({}));
			} catch (error) {
				this.handleSaveError(error);
			} finally {
				this.isLoading.update(() => false);
			}
		}
	}

	/**
	 * Force save current settings
	 */
	async save(): Promise<void> {
		if (!this.adapter) {
			Logger.error('SettingsStore: No adapter set, cannot save');
			return;
		}

		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		try {
			await this.adapter.save();
			this.fieldErrors.update(() => ({}));
		} catch (error) {
			this.handleSaveError(error);
			throw error;
		} finally {
			this.isLoading.update(() => false);
		}
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

	private handleSaveError(error: unknown): void {
		if (error instanceof ZodError) {
			// Convert Zod issues to fieldErrors map
			const errors: Record<string, string> = {};
			for (const issue of error.issues) {
				const path = issue.path.join('.');
				errors[path] = issue.message;
			}
			this.fieldErrors.update(() => errors);
			this.saveError.update(() => 'Validation failed. Please check the fields above.');
		} else if (error instanceof Error) {
			this.saveError.update(() => error.message);
		} else {
			this.saveError.update(() => 'An unexpected error occurred');
		}
		Logger.error('SettingsStore: Save error', error);
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
