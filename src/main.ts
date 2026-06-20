import './ui/styles/main.css';

import { Plugin } from 'obsidian';
import { IAdapter } from './interfaces/IAdapter';
import { IEvent } from './interfaces/IEvent';
import { IEventRegistryDependencies } from './interfaces/IEventRegistry';
import { FlashcardAdapter } from './modules/adapters/FlashcardAdapter';
import { SettingsAdapter } from './modules/adapters/SettingsAdapter';
import { StatisticsAdapter } from './modules/adapters/StatisticsAdapter';
import {
	CommandRegistry,
	CreateEmptyFlashcardCommand,
	CreateFlashcardFromFileCommand,
	DebugAddTestFlashcardCommand,
	GenerateFromSelectionCommand,
	OpenDashboardCommand,
	SetAllFlashcardsDueNowCommand,
} from './modules/commands';
import {
	EventBus,
	EventRegistry,
	FlashcardAdapterInitEvent,
	FlashcardIndexInitEvent,
	IndexRouter,
	SettingsAdapterInitEvent,
	StatisticsAdapterInitEvent,
} from './modules/events';
import { FlashcardIndexer } from './modules/indexers/FlashcardIndexer';
import { FlashcardParser } from './modules/parsers/FlashcardParser';
import { FlashcardWriter } from './modules/writers/FlashcardWriter';
import { PluginSettings } from './schemas/settings';
import { AdapterKey, Adapters } from './types/adapters';
import { CommandKey } from './types/commands';
import { Indexes, IndexKey } from './types/indexes';
import { ParserKey, Parsers } from './types/parsers';
import { WriterKey, Writers } from './types/writers';
import { APP_VIEW, AppView } from './ui/views/App/AppView';
import { SettingsView } from './ui/views/Settings/SettingsView';
import { bannerStore } from '@/ui/store/banner.store';
import { VaultWatcher } from './utils/VaultWatcher';

export default class MnemoloopPlugin extends Plugin {
	private _vaultWatcher?: VaultWatcher;
	private _indexes: Indexes = new Map();
	private _adapter: Adapters = new Map();
	private _parsers: Parsers = new Map();
	private _writers: Writers = new Map();
	private _commandRegistry: CommandRegistry = new CommandRegistry();
	private _eventRegistry!: EventRegistry;
	private _initializationEvents: IEvent[] = [];

	private ribbonIcon?: HTMLElement;

	async onload() {
		this.initializeRibbonIcon();

		this.loadAdapters();
		this.loadParsers();
		this.loadIndexes();
		this.loadWriters();

		this._vaultWatcher = new VaultWatcher(
			this,
			this._adapter.get(AdapterKey.settings) as IAdapter<PluginSettings>,
		);

		await this.initializeEventRegistry();

		this.initializeViews();
		bannerStore.init();
		this.loadCommands();
	}

	onunload() {
		this._vaultWatcher?.dispose();
		this._eventRegistry.dispose();
		this._commandRegistry.unregisterAll();
		this.ribbonIcon?.remove();
	}

	private loadAdapters() {
		this._adapter.set(AdapterKey.settings, new SettingsAdapter(this));
		this._adapter.set(AdapterKey.statistics, new StatisticsAdapter(this));
		this._adapter.set(AdapterKey.flashcard, new FlashcardAdapter(this));

		const events = [
			new FlashcardAdapterInitEvent(),
			new SettingsAdapterInitEvent(),
			new StatisticsAdapterInitEvent(),
		];

		this._initializationEvents.push(...events);
	}

	private loadParsers() {
		const settings = this._adapter.get(AdapterKey.settings) as IAdapter<PluginSettings>;
		if (!settings) throw new Error('failed to initialize adapters');

		this._parsers.set(ParserKey.flashcard, new FlashcardParser(this, settings));
	}

	private loadWriters() {
		const parser = this._parsers.get(ParserKey.flashcard) as FlashcardParser;
		this._writers.set(WriterKey.flashcard, new FlashcardWriter(this, parser));
	}

	private loadIndexes() {
		this._indexes.set(
			IndexKey.flashcard,
			new FlashcardIndexer(
				this._parsers.get(ParserKey.flashcard) as FlashcardParser,
				this._adapter.get(AdapterKey.flashcard) as FlashcardAdapter,
				this._adapter.get(AdapterKey.settings) as IAdapter<PluginSettings>,
			),
		);

		this._initializationEvents.push(new FlashcardIndexInitEvent());
	}

	/**
	 * Initialize all registered events' handlers.
	 */
	private async initializeEventRegistry(): Promise<void> {
		const deps: IEventRegistryDependencies = {
			plugin: this,
			bus: EventBus.instance,
			adapters: this._adapter,
			indexes: this._indexes,
			parsers: this._parsers,
			writers: this._writers,
		};
		this._eventRegistry = new EventRegistry(EventBus.instance, deps, IndexRouter);
		this._eventRegistry.initialize();

		for (const event of this._initializationEvents) {
			await EventBus.instance.publish(event);
		}
	}

	private initializeViews() {
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
		this._commandRegistry.register(
			CommandKey.debugAddTestFlashcards,
			new DebugAddTestFlashcardCommand(),
		);

		this._commandRegistry.initialize({
			plugin: this,
			adapters: this._adapter,
			indexes: this._indexes,
			parsers: this._parsers,
			writers: this._writers,
		});
	}

	private initializeRibbonIcon() {
		this.ribbonIcon = this.addRibbonIcon('orbit', 'Mnemoloop', () => {
			void this.activateView();
		});
	}

	private async activateView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(APP_VIEW)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: APP_VIEW, active: true });
		}

		await workspace.revealLeaf(leaf);
	}
}
