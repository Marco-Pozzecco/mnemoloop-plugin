import './ui/styles/main.css';

import { Notice, Plugin } from 'obsidian';
import { IndexManager } from './core/indexer/IndexerManager';
import { DueQueueManager } from './core/srs';
import { StatisticsManager } from './core/statistics';
import { CommandRegistry } from './obsidian/CommandRegistry';
import { NotificationManager } from './obsidian/NotificationManager';
import { SettingsManager } from './obsidian/SettingsManager';
import { KnowledgeAcceleratorSettingsTab } from './obsidian/SettingsTab';
import { VaultWatcher } from './obsidian/VaultWatcher';
import { IVaultWatcherConfig } from './obsidian/contracts';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettings } from './obsidian/schema/SettingsSchema';
import { APP_VIEW, AppView } from './ui/views/App/AppView';
import { NavigationManager } from './ui/views/App/NavigationManager';
import { Logger } from './utils/Logger';

export default class KnowledgeAcceleratorPlugin extends Plugin {
	private indexManager!: IndexManager;
	private statisticsManager!: StatisticsManager;
	private settingsManager!: SettingsManager;
	private commandRegistry!: CommandRegistry;
	private vaultWatcher!: VaultWatcher;
	private dueQueueManager!: DueQueueManager;
	settings!: PluginSettings;
	notificationManager!: NotificationManager;
	private navigationManager!: NavigationManager;
	private ribbonIcon?: HTMLElement;

	async onload() {
		Logger.info('Loading plugin');

		this.initializeRibbonIcon();
		await this.initializeSettings();
		await this.initializeCommands();
		await this.initializeCoreComponents();
		await this.initializeViews();
		await this.initializeVaultWatcher();
	}

	onunload() {
		Logger.info('Unloading plugin');
		this.vaultWatcher?.shutdown();
		this.notificationManager?.clearStatusBar();
		this.ribbonIcon?.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async initializeCoreComponents() {
		this.indexManager = IndexManager.getInstance(this.app);
		await this.indexManager.initialize();
		this.statisticsManager = StatisticsManager.getInstance(this.app);
		await this.statisticsManager.load();
		this.dueQueueManager = DueQueueManager.getInstance(this.app, this.settings);
		this.dueQueueManager.generate();
		this.navigationManager = new NavigationManager(this.app);
	}

	private async initializeViews() {
		// Register unified AppView
		this.registerView(
			APP_VIEW,
			(leaf) =>
				new AppView(
					leaf,
					this.app,
					this.navigationManager,
					this.indexManager,
					this.statisticsManager,
					this.dueQueueManager,
				),
		);
	}

	private async initializeNotificationManager() {
		// Create status bar item
		const statusBar = this.addStatusBarItem();
		this.notificationManager = new NotificationManager(statusBar);
	}

	private async initializeSettings() {
		this.settingsManager = new SettingsManager(this.app);
		await this.settingsManager.initialize();
		this.addSettingTab(new KnowledgeAcceleratorSettingsTab(this.app, this, this.settingsManager));
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
				Logger.debug('Opening review view');
				try {
					await this.navigationManager.openUnifiedView();
					await this.navigationManager.navigateTo('review');
				} catch (error) {
					Logger.error('Failed to open review view:', error);
					new Notice('Failed to open review view');
				}
			},
		});

		this.commandRegistry.registerCommand({
			id: 'ka-open-dashboard',
			name: 'Knowledge Accelerator: Open Dashboard',
			callback: async () => {
				Logger.debug('Opening dashboard from command');
				await this.navigationManager.openUnifiedView();
				await this.navigationManager.navigateTo('dashboard');
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

	private initializeRibbonIcon() {
		this.ribbonIcon = this.addRibbonIcon('brain', 'Knowledge Accelerator', () => {
			this.navigationManager.openUnifiedView();
		});
	}
}
