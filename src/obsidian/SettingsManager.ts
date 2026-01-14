import { App } from 'obsidian';
import { IPluginSettings, ISettingsManager } from './contracts/ISettingsManager';
import { pluginSettingsSchema } from './schema/SettingsSchema';
import { Logger } from '@/utils/Logger';

export class SettingsManager implements ISettingsManager {
	private app: App;
	private settings: IPluginSettings;
	private changeListeners: Array<(settings: Readonly<IPluginSettings>) => void> = [];
	private readonly DEFAULT_SETTINGS: IPluginSettings = {
		flashcardsDirectory: '/flashcards/',
		watchDirectories: ['/'],
		watchTags: [],
		ignoredDirectories: ['.obsidian'],
		debounceTimeoutMs: 1000,
		enableSoftDelete: true,
		softDeleteHours: 24,
		commandShortcuts: {},
	};
	private readonly CONFIG_FILE = 'knowledge-accelerator/config.json';

	constructor(app: App) {
		this.app = app;
		this.settings = { ...this.DEFAULT_SETTINGS };
	}

	async initialize(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			if (await adapter.exists(this.CONFIG_FILE)) {
				Logger.info(`Loading settings from ${this.CONFIG_FILE}`);
				const data = await adapter.read(this.CONFIG_FILE);
				const parsedSettings: unknown = JSON.parse(data);
				const validatedSettings = this.validateSettings(parsedSettings);
				this.settings = { ...this.DEFAULT_SETTINGS, ...validatedSettings };
				Logger.info('Settings loaded successfully');
			} else {
				Logger.info('Settings file not found, creating with defaults');
				await this.save();
			}
		} catch (error) {
			Logger.error('Failed to load settings:', error);
			Logger.info('Using default settings');
			this.settings = { ...this.DEFAULT_SETTINGS };
		}
	}

	getSettings(): Readonly<IPluginSettings> {
		return this.settings;
	}

	async updateSettings(partialSettings: Partial<IPluginSettings>): Promise<void> {
		const updatedSettings = {
			...this.settings,
			...partialSettings,
		};

		const validatedSettings = this.validateSettings(updatedSettings);
		this.settings = validatedSettings;

		Logger.info('Settings updated:', Object.keys(partialSettings));
		await this.save();

		this.notifyListeners();
	}

	async resetToDefaults(): Promise<void> {
		Logger.info('Resetting settings to defaults');
		this.settings = { ...this.DEFAULT_SETTINGS };
		await this.save();
		this.notifyListeners();
		Logger.info('Settings reset to defaults');
	}

	validateSettings(settings: unknown): IPluginSettings {
		return this.getSchema().parse(settings);
	}

	onSettingsChanged(callback: (settings: Readonly<IPluginSettings>) => void): () => void {
		this.changeListeners.push(callback);
		Logger.info(`Settings change listener registered (${this.changeListeners.length} total)`);

		return () => {
			const index = this.changeListeners.indexOf(callback);
			if (index !== -1) {
				this.changeListeners.splice(index, 1);
				Logger.info(`Settings change listener removed (${this.changeListeners.length} remaining)`);
			}
		};
	}

	getSchema() {
		return pluginSettingsSchema;
	}

	private async save(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			const dir = this.CONFIG_FILE.split('/').slice(0, -1).join('/');
			if (!(await adapter.exists(dir))) {
				Logger.info(`Creating settings directory: ${dir}`);
				await adapter.mkdir(dir);
			}

			await adapter.write(this.CONFIG_FILE, JSON.stringify(this.settings, null, 2));
			Logger.info(`Settings saved to ${this.CONFIG_FILE}`);
		} catch (error) {
			Logger.error('Failed to save settings:', error);
			throw new Error(
				`Settings save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	private notifyListeners(): void {
		for (const listener of this.changeListeners) {
			listener(this.settings);
		}
	}
}
