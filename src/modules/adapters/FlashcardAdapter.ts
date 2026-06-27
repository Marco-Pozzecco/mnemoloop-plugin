import { DEFAULT_FLASHCARD_INDEX, FlashcardIndex, FlashcardIndexSchema } from '@/schemas';
import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';

export class FlashcardAdapter extends BaseAdapter<FlashcardIndex> {
	private _path: string;
	private _filename = 'flashcard-index.json';

	constructor(private plugin: Plugin) {
		super(DEFAULT_FLASHCARD_INDEX, FlashcardIndexSchema);
		this._path = `${plugin.manifest.dir}/${this._filename}`;
	}

	protected async loadData(): Promise<unknown> {
		const content = await this.plugin.app.vault.adapter.read(this._path);
		if (content) {
			return JSON.parse(content);
		}
		return this.defaultData;
	}

	protected async saveData(data: FlashcardIndex): Promise<void> {
		const exists = await this.plugin.app.vault.adapter.exists(this._path);
		const serialized = JSON.stringify(data);
		if (exists) {
			await this.plugin.app.vault.adapter.write(this._path, serialized);
		} else {
			await this.plugin.app.vault.create(this._path, serialized);
		}
	}
}
