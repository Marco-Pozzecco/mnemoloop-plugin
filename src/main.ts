import { Plugin, Notice } from 'obsidian';
import { PluginSettings, DEFAULT_PLUGIN_SETTINGS } from './core/plugin/types';
import { KnowledgeAcceleratorSettingsTab } from './obsidian/SettingsTab';
import { IndexManager } from './core/indexer/managers/IndexManager';
import { VaultWatcher } from './obsidian/VaultWatcher';
import { SettingsManager } from './obsidian/SettingsManager';
import { CommandRegistry } from './obsidian/CommandRegistry';
import { NotificationManager } from './obsidian/NotificationManager';
import { IVaultWatcherConfig } from './obsidian/contracts';
import { DASHBOARD_VIEW_TYPE, DashboardView } from './ui/views/Dashboard/DashboardView';
import { ReviewView, REVIEW_VIEW_TYPE } from './ui/views/Review/ReviewView';
import { SessionStore } from './ui/stores/SessionStore';

import { Logger } from './utils/Logger';
import { StatsManager } from './core/indexer';
import { DueQueueManager } from './core';

export default class KnowledgeAcceleratorPlugin extends Plugin {
	private indexManager!: IndexManager;
	private statsManager!: StatsManager;
	private settingsManager!: SettingsManager;
	private commandRegistry!: CommandRegistry;
	private vaultWatcher!: VaultWatcher;
	private dueQueue!: DueQueueManager;
	private sessionStore!: SessionStore;
	settings!: PluginSettings;
	notificationManager!: NotificationManager;

	async onload() {
		Logger.info('Loading plugin');

		await this.initializeNotificationManager();
		await this.initializeCoreComponents();
		await this.initializeViews();
		await this.initializeSettings();
		await this.initializeCommands();
		await this.initializeVaultWatcher();
	}

	onunload() {
		Logger.info('Unloading plugin');
		this.vaultWatcher.shutdown();
		this.notificationManager.clearStatusBar();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async initializeCoreComponents() {
		this.indexManager = IndexManager.getInstance(this.app);
		await this.indexManager.load();
		this.statsManager = StatsManager.getInstance(this.app);
		await this.statsManager.load();
		this.dueQueue = DueQueueManager.getInstance(this.app);
		this.dueQueue.generate();
		this.sessionStore = new SessionStore(this.indexManager, this.statsManager, this.dueQueue);
	}

	private async initializeViews() {
		// Register the Dashboard view type
		this.registerView(
			DASHBOARD_VIEW_TYPE,
			(leaf) =>
				new DashboardView(
					leaf,
					this.indexManager,
					this.statsManager,
					this.sessionStore,
					this.dueQueue,
				),
		);
		// Register the Review view type
		this.registerView(
			REVIEW_VIEW_TYPE,
			(leaf) =>
				new ReviewView(
					leaf,
					this.indexManager,
					this.statsManager,
					this.sessionStore,
					this.dueQueue,
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
				Logger.debug('Starting review session');
				try {
					await this.sessionStore.startSession();
					await this.openReviewView();
				} catch (error) {
					Logger.error('Failed to start review session:', error);
					new Notice('No cards due for review!');
				}
			},
		});

		this.commandRegistry.registerCommand({
			id: 'ka-open-dashboard',
			name: 'Knowledge Accelerator: Open Dashboard',
			callback: async () => {
				Logger.debug('Opening dashboard');
				await this.openDashboard();
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

	/**
	 * Opens the Dashboard view in the Obsidian workspace
	 */
	private async openDashboard() {
		try {
			const { workspace } = this.app;
			let leaf = workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE)[0];

			if (!leaf) {
				const newLeaf = workspace.getRightLeaf(false);
				if (newLeaf) leaf = newLeaf;
				await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
			}

			workspace.revealLeaf(leaf);
		} catch (error) {
			Logger.error('Failed to open dashboard:', error);
			new Notice('Failed to open dashboard. Please try again.');
		}
	}

	/**
	 * Opens the Review view in the Obsidian workspace
	 */
	private async openReviewView() {
		try {
			const { workspace } = this.app;
			let leaf = workspace.getLeavesOfType(REVIEW_VIEW_TYPE)[0];

			if (!leaf) {
				leaf = workspace.getLeaf('tab');
				await leaf.setViewState({ type: REVIEW_VIEW_TYPE, active: true });
			}

			workspace.revealLeaf(leaf);
		} catch (error) {
			Logger.error('Failed to open review view:', error);
			new Notice('Failed to open review view. Please try again.');
		}
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
