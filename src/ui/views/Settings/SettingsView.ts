import { mount, unmount } from 'svelte';
import { Plugin, PluginSettingTab } from 'obsidian';
import Settings from './Settings.svelte';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { Logger } from '@/utils/Logger';
import { settingsStore } from '@/ui/store/settings.store';

export class SettingsView extends PluginSettingTab {
	private component: ReturnType<typeof mount> | null = null;
	private adapter: SettingsAdapter;

	constructor(plugin: Plugin, settings: SettingsAdapter) {
		super(plugin.app, plugin);
		this.adapter = settings;
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.addClass('ka-settings-view');

		settingsStore.initialize(this.adapter);

		this.component = mount(Settings, {
			target: this.containerEl,
			props: {},
		});
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

			this.containerEl.empty();
			this.containerEl.removeClass('ka-settings-view');

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
