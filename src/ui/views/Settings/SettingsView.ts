import { settingsStore } from '@/ui/store/settings.store';
import { Logger } from '@/utils/Logger';
import { Plugin, PluginSettingTab } from 'obsidian';
import { mount, unmount } from 'svelte';
import Settings from './Settings.svelte';

export class SettingsView extends PluginSettingTab {
	private component: ReturnType<typeof mount> | null = null;

	constructor(plugin: Plugin) {
		super(plugin.app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.addClass('ka-settings-view');

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
			// Call unmount function if exists
			if (this.component) {
				unmount(this.component);
				this.component = null;
			}

			this.containerEl.empty();
			this.containerEl.removeClass('ka-settings-view');

			// Dispose settings store
			settingsStore.dispose();
		} catch (error) {
			Logger.error('Failed to destroy Settings view:', error);
		}
	}

	/**
	 * Force save current settings
	 */
	async save(): Promise<void> {
		try {
			await settingsStore.save();
		} catch (error) {
			Logger.error('Failed to save settings from SettingsView:', error);
			throw error;
		}
	}
}
