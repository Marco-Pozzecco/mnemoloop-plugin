import { Plugin } from 'obsidian';
import { PluginSettings } from './core/types';
import { IndexManager } from './core/indexer/managers/IndexManager';
import { VaultWatcher } from './obsidian/VaultWatcher';
import { SettingsManager } from './obsidian/SettingsManager';
import { CommandRegistry } from './obsidian/CommandRegistry';
import { IVaultWatcherConfig } from './obsidian/contracts';

const DEFAULT_SETTINGS: PluginSettings = {
	flashcardsDirectory: 'Flashcards/',
	reviewIntervals: [1, 3, 7, 14, 30],
	baseEase: 2.5,
};

export default class KnowledgeAcceleratorPlugin extends Plugin {
	settings!: PluginSettings;
	private indexManager!: IndexManager;
	private vaultWatcher!: VaultWatcher;
	private settingsManager!: SettingsManager;
	private commandRegistry!: CommandRegistry;

	async onload() {
		console.log('Loading Obsidian Knowledge Accelerator');

		await this.initializeCoreComponents();
		await this.initializeSettings();
		await this.initializeCommands();
		await this.initializeVaultWatcher();
	}

	onunload() {
		console.log('Unloading Obsidian Knowledge Accelerator');
		this.vaultWatcher.shutdown();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async initializeCoreComponents() {
		this.indexManager = new IndexManager(this.app);
		await this.indexManager.load();
	}

	private async initializeSettings() {
		this.settingsManager = new SettingsManager(this.app);
		await this.settingsManager.initialize();
		this.settingsManager.onSettingsChanged((settings) => {
			const vaultConfig: IVaultWatcherConfig = {
				watchDirectories: settings.watchDirectories,
				watchTags: settings.watchTags,
				ignoredDirectories: settings.ignoredDirectories,
				debounceTimeoutMs: settings.debounceTimeoutMs,
				enableSoftDelete: settings.enableSoftDelete,
				softDeleteHours: settings.softDeleteHours,
			};
			this.vaultWatcher?.updateConfiguration(vaultConfig);
		});
	}

	private async initializeCommands() {
		this.commandRegistry = new CommandRegistry();
		this.commandRegistry.initialize(this);

		this.commandRegistry.registerCommand({
			id: 'ka-start-review',
			name: 'Knowledge Accelerator: Start Review',
			callback: async () => {
				console.log('Starting review session');
			},
		});

		this.commandRegistry.registerCommand({
			id: 'ka-open-dashboard',
			name: 'Knowledge Accelerator: Open Dashboard',
			callback: async () => {
				console.log('Opening dashboard');
			},
		});

		this.commandRegistry.registerCommand({
			id: 'open-settings',
			name: 'Knowledge Accelerator: Open Settings',
			callback: async () => {
				(this.app as any).setting.openTabById(this.manifest.id);
			},
		});
	}

	private async initializeVaultWatcher() {
		const pluginSettings = this.settingsManager.getSettings();
		this.vaultWatcher = new VaultWatcher(this.app, this.indexManager, {
			watchDirectories: pluginSettings.watchDirectories,
			watchTags: pluginSettings.watchTags,
			ignoredDirectories: pluginSettings.ignoredDirectories,
			debounceTimeoutMs: pluginSettings.debounceTimeoutMs,
			enableSoftDelete: pluginSettings.enableSoftDelete,
			softDeleteHours: pluginSettings.softDeleteHours,
		});
		await this.vaultWatcher.initialize();
	}
}
