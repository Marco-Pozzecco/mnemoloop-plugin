import { mount, unmount } from 'svelte';
import { Plugin } from 'obsidian';
import Settings from './Settings.svelte';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { Logger } from '@/utils/Logger';
import { settingsStore } from '@/ui/store/settings.store';

export class SettingsView {
	private plugin: Plugin;
	private container: HTMLElement | null = null;
	private component: ReturnType<typeof mount> | null = null;
	private adapter: SettingsAdapter | null = null;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	/**
	 * Mount the settings UI into the provided container
	 */
	async mount(container: HTMLElement): Promise<void> {
		try {
			Logger.info('Mounting Settings view');

			// Save container reference
			this.container = container;
			container.empty();
			container.addClass('ka-settings-view');

			// Create and initialize adapter
			this.adapter = new SettingsAdapter(this.plugin);
			await this.adapter.initialize();

			// Initialize settings store with adapter
			settingsStore.initialize(this.adapter);

			// Mount Svelte 5 component using mount() from 'svelte'
			this.component = mount(Settings, {
				target: container,
				props: {},
			});

			Logger.info('Settings view mounted successfully');
		} catch (error) {
			Logger.error('Failed to mount Settings view:', error);
			container.createEl('div', { text: 'Failed to load Settings view' });
			throw error;
		}
	}

	/**
	 * Unmount and cleanup
	 */
	destroy(): void {
		try {
			Logger.info('Destroying Settings view');

			// Call unmount function if exists
			if (this.component) {
				unmount(this.component);
				this.component = null;
			}

			// Clear container reference
			if (this.container) {
				this.container.empty();
				this.container.removeClass('ka-settings-view');
				this.container = null;
			}

			// Dispose settings store
			settingsStore.dispose();

			Logger.info('Settings view destroyed successfully');
		} catch (error) {
			Logger.error('Failed to destroy Settings view:', error);
		}
	}

	/**
	 * Force save current settings
	 */
	async save(): Promise<void> {
		try {
			Logger.info('Saving settings from SettingsView');

			await settingsStore.save();

			Logger.info('Settings saved successfully from SettingsView');
		} catch (error) {
			Logger.error('Failed to save settings from SettingsView:', error);
			throw error;
		}
	}
}
