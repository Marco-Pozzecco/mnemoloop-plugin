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
		this.containerEl.addClass('ml-settings-view');

		this.component = mount(Settings, {
			target: this.containerEl,
			props: {},
		});
	}

	hide(): void {
		this.destroy();
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
			this.containerEl.removeClass('ml-settings-view');
		} catch (error) {
			Logger.error('Failed to destroy Settings view:', error);
		} finally {
			// Dispose settings store
			settingsStore.dispose();
		}
	}
}
