import { App, PluginSettingTab } from 'obsidian';
import type KnowledgeAcceleratorPlugin from '@/main';
import type { SettingsManager } from './SettingsManager';
import Settings from '@/ui/settings/Settings.svelte';
import type { IPluginSettings } from './contracts/ISettingsManager';

export class KnowledgeAcceleratorSettingsTab extends PluginSettingTab {
	private plugin: KnowledgeAcceleratorPlugin;
	private settingsManager: SettingsManager;
	private component?: Settings;

	constructor(app: App, plugin: KnowledgeAcceleratorPlugin, settingsManager: SettingsManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.settingsManager = settingsManager;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('ka-settings-tab');

		const initialSettings: IPluginSettings = {
			...this.settingsManager.getSettings(),
		};

		this.component = new Settings({
			target: containerEl,
			props: {
				app: this.app,
				plugin: this.plugin,
				settingsManager: this.settingsManager,
				initialSettings,
			},
		});
	}

	hide(): void {
		this.component?.$destroy();
		this.component = undefined;
	}
}
