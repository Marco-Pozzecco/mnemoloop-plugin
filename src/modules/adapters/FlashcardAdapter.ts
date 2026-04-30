import { IEvent } from '@/interfaces/IEvent';
import { DEFAULT_FLASHCARD_INDEX, FlashcardIndex, FlashcardIndexSchema } from '@/schemas';
import { Plugin, TFile } from 'obsidian';
import {
	AdapterAction,
	EventBus,
	FlashcardAdapterInitResponseEvent,
	FlashcardAdapterResetResponseEvent,
	FlashcardAdapterSaveResponseEvent,
	FlashcardAdapterSetResponseEvent,
	FlashcardAdapterUpdatedResponseEvent,
} from '../events';
import { BaseAdapter } from './BaseAdapter';

export class FlashcardAdapter extends BaseAdapter<FlashcardIndex> {
	private _path: string;

	constructor(private plugin: Plugin) {
		super(DEFAULT_FLASHCARD_INDEX, FlashcardIndexSchema);
		const dir = this.plugin.manifest.dir;
		this._path = `${dir}/flashcard-index.json`;
	}

	emit: (action: AdapterAction) => void = (action) => {
		let event: IEvent | null = null;

		switch (action) {
			case AdapterAction.Init:
				event = new FlashcardAdapterInitResponseEvent(this._data);
				break;
			case AdapterAction.Save:
				event = new FlashcardAdapterSaveResponseEvent(this._data);
				break;
			case AdapterAction.Reset:
				event = new FlashcardAdapterResetResponseEvent(this._data);
				break;
			case AdapterAction.Update:
				event = new FlashcardAdapterUpdatedResponseEvent(this._data);
				break;
			case AdapterAction.Set:
				event = new FlashcardAdapterSetResponseEvent(this._data);
				break;
		}

		if (event) {
			EventBus.instance.publish(event);
		}
	};

	protected async loadData(): Promise<unknown> {
		const file = this.plugin.app.vault.getAbstractFileByPath(this._path);
		if (file instanceof TFile) {
			const contentStr = await this.plugin.app.vault.read(file);
			return JSON.parse(contentStr);
		}
		return this.defaultData;
	}

	protected async saveData(data: FlashcardIndex): Promise<void> {
		const fileExists = await this.plugin.app.vault.adapter.exists(this._path);
		if (fileExists) {
			await this.plugin.app.vault.adapter.write(this._path, JSON.stringify(data));
		} else {
			await this.plugin.app.vault.create(this._path, JSON.stringify(data));
		}
	}
}
