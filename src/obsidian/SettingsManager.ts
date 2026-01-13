import { App } from 'obsidian';
import { z } from 'zod';
import { IPluginSettings, ISettingsManager } from './contracts/ISettingsManager';

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
				const data = await adapter.read(this.CONFIG_FILE);
				const parsedSettings: unknown = JSON.parse(data);
				const validatedSettings = this.validateSettings(parsedSettings);
				this.settings = { ...this.DEFAULT_SETTINGS, ...validatedSettings };
			} else {
				await this.save();
			}
		} catch (error) {
			console.error('Failed to load settings:', error);
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

		await this.save();

		this.notifyListeners();
	}

	async resetToDefaults(): Promise<void> {
		this.settings = { ...this.DEFAULT_SETTINGS };
		await this.save();
		this.notifyListeners();
	}

	validateSettings(settings: unknown): IPluginSettings {
		return this.getSchema().parse(settings);
	}

	onSettingsChanged(callback: (settings: Readonly<IPluginSettings>) => void): () => void {
		this.changeListeners.push(callback);

		return () => {
			const index = this.changeListeners.indexOf(callback);
			if (index !== -1) {
				this.changeListeners.splice(index, 1);
			}
		};
	}

	getSchema(): z.ZodType<IPluginSettings> {
		return z.object({
			flashcardsDirectory: z.string(),
			watchDirectories: z.array(z.string()).min(1),
			watchTags: z.array(z.string().startsWith('#')),
			ignoredDirectories: z.array(z.string()),
			debounceTimeoutMs: z.number().min(100).max(5000),
			enableSoftDelete: z.boolean(),
			softDeleteHours: z.number().min(1).max(168),
			commandShortcuts: z.record(z.string(), z.string()),
		});
	}

	private async save(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			const dir = this.CONFIG_FILE.split('/').slice(0, -1).join('/');
			if (!(await adapter.exists(dir))) {
				await adapter.mkdir(dir);
			}

			await adapter.write(this.CONFIG_FILE, JSON.stringify(this.settings, null, 2));
		} catch (error) {
			console.error('Failed to save settings:', error);
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
