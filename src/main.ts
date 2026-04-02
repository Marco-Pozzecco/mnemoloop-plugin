import './ui/styles/main.css';

import { Notice, Plugin } from 'obsidian';
import { IAdapter } from './interfaces/IAdapter';
import { SettingsAdapter } from './modules/adapters/SettingsAdapter';
import { StatisticsAdapter } from './modules/adapters/StatisticsAdapter';
import { StatisticsListener } from './modules/event-listeners/StatisticsListener';
import { FlascardIndexer } from './modules/indexers/FlashcardIndexer';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettings } from './schemas/settings';
import { AdapterKey, Adapters } from './types/adapters';
import { Indexes, IndexKey } from './types/indexes';
import { ListenerKey, Listeners } from './types/listeners';
import { APP_VIEW, AppView } from './ui/views/App/AppView';
import { Logger } from './utils/Logger';

export default class KnowledgeAcceleratorPlugin extends Plugin {
	private _indexes: Indexes = new Map();
	private _adapter: Adapters = new Map();
	private _listeners: Listeners = new Map();
	settings!: PluginSettings;
	private ribbonIcon?: HTMLElement;

	async onload() {
		Logger.info('Loading plugin');

		this.initializeRibbonIcon();
		await this.initializeCommands();
		await this.loadAdapters();
		await this.loadListeners();
		await this.loadIndexes();
		await this.initializeViews();
	}

	onunload() {
		Logger.info('Unloading plugin');
		this._listeners.forEach((listener) => listener.dispose());
		this.ribbonIcon?.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async loadAdapters() {
		this._adapter.set(AdapterKey.settings, new SettingsAdapter(this));
		this._adapter.set(AdapterKey.statistics, new StatisticsAdapter(this));
		this._adapter.forEach(async (adapter) => await adapter.initialize());
		Logger.info('adapters initialized');
	}

	private async loadIndexes() {
		const settingsAdapter = this._adapter.get(AdapterKey.settings) as
			| IAdapter<PluginSettings>
			| undefined;

		if (!settingsAdapter) {
			throw new Error('failed to initialize adapters');
		}

		this._indexes.set(IndexKey.flashcard, new FlascardIndexer(this, settingsAdapter));

		this._indexes.forEach(async (index) => await index.initialize());
		Logger.info('indexes initialized');
	}

	private async loadListeners() {
		this._listeners.set(
			ListenerKey.statistics,
			new StatisticsListener(this._adapter.get(AdapterKey.statistics) as StatisticsAdapter),
		);

		Logger.info('listeners initialized');
	}

	private async initializeViews() {
		this.registerView(APP_VIEW, (leaf) => new AppView(this.app, leaf, this._indexes));
	}

	private async initializeCommands() {
		this.addCommand({
			id: 'ka-start-review',
			name: 'Knowledge Accelerator: Start Review',
			callback: async () => {
				Logger.debug('Opening review view');
				try {
				} catch (error) {
					Logger.error('Failed to open review view:', error);
					new Notice('Failed to open review view');
				}
			},
		});

		this.addCommand({
			id: 'ka-open-dashboard',
			name: 'Knowledge Accelerator: Open Dashboard',
			callback: async () => {
				Logger.debug('Opening dashboard from command');
			},
		});

		this.addCommand({
			id: 'open-settings',
			name: 'Knowledge Accelerator: Open Settings',
			callback: async () => {
				(this.app as any).setting.openTabById(this.manifest.id);
			},
		});
	}

	private initializeRibbonIcon() {
		this.ribbonIcon = this.addRibbonIcon('brain', 'Knowledge Accelerator', () => {
			this.activateView();
		});
	}

	private async activateView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(APP_VIEW)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: APP_VIEW, active: true });
		}

		workspace.revealLeaf(leaf);
	}
}
