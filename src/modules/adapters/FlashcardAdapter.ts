import { DEFAULT_FLASHCARD_INDEX, FlashcardIndex, FlashcardIndexSchema } from '@/schemas';
import { BaseAdapter } from './BaseAdapter';
import { Plugin, TFile } from 'obsidian';
import { AdapterEventsKeys, AdapterKey } from '@/types/adapters';

export class FlashcardAdapter extends BaseAdapter<FlashcardIndex, AdapterKey.flashcard> {
	private _path: string;

	constructor(private plugin: Plugin) {
		super(
			DEFAULT_FLASHCARD_INDEX,
			AdapterEventsKeys.flashcard,
			'flashcard_index',
			FlashcardIndexSchema,
		);
		const dir = this.plugin.manifest.dir;
		this._path = `${dir}/flashcard-index.json`;
	}

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
