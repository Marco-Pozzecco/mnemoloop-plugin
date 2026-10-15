import {
	EventBus,
	FlashcardIndexInitEvent,
	SettingsAdapterResetEvent,
	SettingsAdapterSaveEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterStateEvent,
	SettingsAdapterUpdateRequestEvent,
} from '@/modules/events';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettings, PluginSettingsSchema } from '@/schemas/settings';
import { writable, Writable } from 'svelte/store';
import { simpleClone } from '@/utils/Clone';
import { setPath } from '@/utils/dot-path';
import { BaseStoreManager } from './base.store';

/** How long `commitPath` waits for the pipeline's state event before rejecting. */
export const SETTINGS_COMMIT_TIMEOUT_MS = 5000;

const settingsWritable = writable(DEFAULT_PLUGIN_SETTINGS);
const isLoadingStore = writable(false);
const saveErrorStore = writable<string | null>(null);

export class SettingsStore extends BaseStoreManager<PluginSettings> {
	private _unsubscribe: () => void = () => {};

	// Public stores for direct access in Svelte components
	settings: Writable<PluginSettings>;
	isLoading: Writable<boolean>;
	saveError: Writable<string | null>;

	constructor() {
		super(DEFAULT_PLUGIN_SETTINGS, settingsWritable);
		this.settings = settingsWritable;
		this.isLoading = isLoadingStore;
		this.saveError = saveErrorStore;

		const handler = async (event: SettingsAdapterStateEvent) => {
			this.settings.update((state) => {
				const updated = { ...state, ...event.data };
				// If the watch config has changed, trigger a flashcard index re-initialize
				if (state.flashcard.watch.directory !== updated.flashcard.watch.directory) {
					void EventBus.instance.publish(new FlashcardIndexInitEvent());
				}
				return updated;
			});
			this.saveError.update(() => null);
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
		void EventBus.instance.publish(request);
	}

	async updateNestedField(path: string[], value: unknown): Promise<boolean> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const currentSettings = simpleClone(this.currentSettings) as Record<string, unknown>;
		setPath(currentSettings, path.join('.'), value);
		const result = PluginSettingsSchema.safeParse(currentSettings);

		if (!result.success) {
			const issue =
				result.error.issues.find((candidate) =>
					path.every((segment, index) => candidate.path[index] === segment),
				) ?? result.error.issues[0];
			this.saveError.update(() => issue?.message ?? 'Invalid setting');
			this.isLoading.update(() => false);
			return false;
		}

		const request = new SettingsAdapterUpdateRequestEvent(result.data);
		void EventBus.instance.publish(request);
		return true;
	}

	/**
	 * Persist a single nested value and resolve only after the pipeline has
	 * written it to disk. The state event is published only once the adapter
	 * handler has awaited `adapter.save()`, so resolving on it guarantees a
	 * durable write. Rejects on invalid input, a publish failure, or a timeout.
	 */
	async commitPath(dotPath: string, value: unknown): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const path = dotPath.split('.');
		const currentSettings = simpleClone(this.currentSettings) as Record<string, unknown>;
		setPath(currentSettings, dotPath, value);
		const result = PluginSettingsSchema.safeParse(currentSettings);

		if (!result.success) {
			const issue =
				result.error.issues.find((candidate) =>
					path.every((segment, index) => candidate.path[index] === segment),
				) ?? result.error.issues[0];
			const message = issue?.message ?? 'Invalid setting';
			this.failCommit(message);
			throw new Error(message);
		}

		try {
			await this.publishAndAwaitState(new SettingsAdapterUpdateRequestEvent(result.data));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.failCommit(message);
			throw error instanceof Error ? error : new Error(message);
		}
	}

	private failCommit(message: string): void {
		this.saveError.update(() => message);
		this.isLoading.update(() => false);
	}

	private publishAndAwaitState(request: SettingsAdapterUpdateRequestEvent): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let unsubscribe: () => void = () => {};
			const timeout = window.setTimeout(() => {
				unsubscribe();
				reject(new Error('Timed out waiting for settings to save'));
			}, SETTINGS_COMMIT_TIMEOUT_MS);

			unsubscribe = EventBus.instance.subscribe(SettingsAdapterStateEvent, async () => {
				window.clearTimeout(timeout);
				unsubscribe();
				resolve();
			});

			void EventBus.instance.publish(request).catch((error: unknown) => {
				window.clearTimeout(timeout);
				unsubscribe();
				reject(error instanceof Error ? error : new Error(String(error)));
			});
		});
	}

	async reset(): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const request = new SettingsAdapterResetEvent();
		void EventBus.instance.publish(request);
	}

	async save(): Promise<void> {
		this.isLoading.update(() => true);
		this.saveError.update(() => null);

		const request = new SettingsAdapterSaveEvent();
		void EventBus.instance.publish(request);
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
}

// Singleton instance of SettingsStore
export const settingsStore = new SettingsStore();
