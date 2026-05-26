import './ui/styles/main.css';

import { Plugin } from 'obsidian';
import { IAdapter } from './interfaces/IAdapter';
import { FlashcardAdapter } from './modules/adapters/FlashcardAdapter';
import { SettingsAdapter } from './modules/adapters/SettingsAdapter';
import { StatisticsAdapter } from './modules/adapters/StatisticsAdapter';
import {
	CommandRegistry,
	CreateEmptyFlashcardCommand,
	CreateFlashcardFromFileCommand,
	GenerateFromSelectionCommand,
	OpenDashboardCommand,
	SetAllFlashcardsDueNowCommand,
} from './modules/commands';
import { EventRegistry } from './modules/events';
import { FlascardIndexer } from './modules/indexers/FlashcardIndexer';
import { FlashcardParser } from './modules/parsers/FlashcardParser';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettings } from './schemas/settings';
import { AdapterKey, Adapters } from './types/adapters';
import { CommandKey } from './types/commands';
import { Indexes, IndexKey } from './types/indexes';
import { ParserKey, Parsers } from './types/parsers';
import { APP_VIEW, AppView } from './ui/views/App/AppView';
import { SettingsView } from './ui/views/Settings/SettingsView';
import { Logger } from './utils/Logger';

export default class MnemoloopPlugin extends Plugin {
	private _indexes: Indexes = new Map();
	private _adapter: Adapters = new Map();
	private _parsers: Parsers = new Map();
	private _commandRegistry: CommandRegistry = new CommandRegistry();

	settings!: PluginSettings;
	private ribbonIcon?: HTMLElement;

	async onload() {
		Logger.info('Loading plugin');

		this.initializeRibbonIcon();
		await this.loadAdapters();
		await this.loadParsers();
		await this.loadIndexes();

		// Initialize event processors with dependencies
		this.initializeEventProcessors();

		await this.initializeViews();
		this.loadCommands();
	}

	onunload() {
		Logger.info('Unloading plugin');
		// Dispose all event processors via registry
		EventRegistry.instance.dispose();
		this._commandRegistry.unregisterAll();
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
		this._adapter.set(AdapterKey.flashcard, new FlashcardAdapter(this));

		const promises = Array.from(this._adapter.values()).map(async (adapter) => {
			await adapter.initialize();
		});

		await Promise.all(promises);

		Logger.info('adapters initialized', { count: promises.length });
	}

	private async loadParsers() {
		const settings = this._adapter.get(AdapterKey.settings) as IAdapter<PluginSettings>;
		if (!settings) throw new Error('failed to initialize adapters');

		this._parsers.set(ParserKey.flashcard, new FlashcardParser(this, settings));
	}

	private async loadIndexes() {
		this._indexes.set(
			IndexKey.flashcard,
			new FlascardIndexer(
				this._parsers.get(ParserKey.flashcard) as FlashcardParser,
				this._adapter.get(AdapterKey.flashcard) as FlashcardAdapter,
				this._adapter.get(AdapterKey.settings) as IAdapter<PluginSettings>,
			),
		);

		const indexPromises = Array.from(this._indexes.values()).map(async (index) => {
			await index.initialize();
		});

		await Promise.all(indexPromises);
		Logger.info('indexes initialized');
	}

	/**
	 * Initialize all registered event processors with dependencies.
	 */
	private initializeEventProcessors(): void {
		EventRegistry.instance.initialize({
			plugin: this,
			adapters: this._adapter,
			indexes: this._indexes,
			parsers: this._parsers,
		});
		Logger.info('event processors initialized');
	}

	private async initializeViews() {
		this.registerView(APP_VIEW, (leaf) => new AppView(this.app, leaf));

		this.addSettingTab(new SettingsView(this));
	}

	private loadCommands(): void {
		this._commandRegistry.register(CommandKey.openDashboard, new OpenDashboardCommand());
		this._commandRegistry.register(
			CommandKey.createEmptyFlashcard,
			new CreateEmptyFlashcardCommand(),
		);
		this._commandRegistry.register(
			CommandKey.generateFromSelection,
			new GenerateFromSelectionCommand(),
		);
		this._commandRegistry.register(
			CommandKey.createFlashcardFromFile,
			new CreateFlashcardFromFileCommand(),
		);
		this._commandRegistry.register(
			CommandKey.setAllFlashcardsDueNow,
			new SetAllFlashcardsDueNowCommand(),
		);

		this._commandRegistry.initialize({
			plugin: this,
			adapters: this._adapter,
			indexes: this._indexes,
			parsers: this._parsers,
		});

		Logger.info('commands initialized');
	}

	private initializeRibbonIcon() {
		this.ribbonIcon = this.addRibbonIcon('orbit', 'Mnemoloop', () => {
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
