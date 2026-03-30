import { FlashcardIndex, FlashcardIndexSchema } from '@/schemas';
import { BaseAdapter } from './BaseAdapter';
import { Plugin, TFile } from 'obsidian';
import { Logger } from '@/utils/Logger';
import { AdapterEventsKeys, AdapterFlashcardEvents, AdapterKey } from '@/types/adapters';
import { EventBus } from '../event-bus/EventBus';

const DefaultData: FlashcardIndex = {
	flashcards: [],
	updated_at: null,
};

export class FlashcardAdapter extends BaseAdapter<FlashcardIndex, AdapterKey.flashcard> {
	private _path: string;

	constructor(private plugin: Plugin) {
		super(DefaultData, AdapterEventsKeys.flashcard, 'flashcard_index');
		const dir = this.plugin.manifest.dir;
		this._path = `${dir}/flashcard-index.json`;
	}

	initialize: () => Promise<void> = async () => {
		const file = this.plugin.app.vault.getAbstractFileByPath(this._path);
		if (file instanceof TFile) {
			const contentStr = await this.plugin.app.vault.read(file);
			const json = JSON.parse(contentStr);
			try {
				const index = this.validate(json);
				this.set(index);
			} catch (error) {
				Logger.warn('Index file is corrupted. Resetting...');
				this.save();
			}
		}
		await this.save();

		const event: AdapterFlashcardEvents['init'] = {
			event_type: AdapterEventsKeys.flashcard.init,
			created_at: new Date(),
			data: {
				flashcard_index: this._data,
			},
		};
		EventBus.instance.publish(event);
	};

	save: () => Promise<void> = async () => {
		const file = await this.plugin.app.vault.adapter.exists(this._path);
		if (file) {
			await this.plugin.app.vault.adapter.write(this._path, JSON.stringify(this._data));
		} else {
			await this.plugin.app.vault.create(this._path, JSON.stringify(this._data));
		}

		const event: AdapterFlashcardEvents['save'] = {
			event_type: AdapterEventsKeys.flashcard.save,
			created_at: new Date(),
			data: {
				flashcard_index: this._data,
				saved_at: new Date(),
			},
		};
		EventBus.instance.publish(event);
	};

	protected validate(data: FlashcardIndex) {
		return FlashcardIndexSchema.parse(data);
	}
}
