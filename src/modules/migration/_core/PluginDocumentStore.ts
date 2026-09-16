import type { IDocumentStore } from '@/interfaces/migration/IDocumentStore';
import type { Plugin } from 'obsidian';
import { DATA_FILE } from '../_utils/documents';

/**
 * The only Obsidian-bound piece of the migration module.
 *
 * `data.json` is stored through the plugin API (`loadData`/`saveData`), while
 * every other document lives as a JSON file inside the plugin directory and is
 * stored through the vault adapter. Documents that are absent resolve to
 * `undefined`.
 */
export class PluginDocumentStore implements IDocumentStore {
	constructor(private readonly _plugin: Plugin) {}

	async read(name: string): Promise<unknown> {
		if (name === DATA_FILE) {
			return (await this._plugin.loadData()) ?? undefined;
		}

		const adapter = this._plugin.app.vault.adapter;
		const path = this.path(name);
		if (!(await adapter.exists(path))) {
			return undefined;
		}

		const content = await adapter.read(path);
		if (content.trim() === '') {
			return undefined;
		}

		try {
			return JSON.parse(content) as unknown;
		} catch {
			throw new Error(`failed to parse ${path}`);
		}
	}

	async write(name: string, data: unknown): Promise<void> {
		if (name === DATA_FILE) {
			await this._plugin.saveData(data);
			return;
		}

		const adapter = this._plugin.app.vault.adapter;
		const path = this.path(name);
		const serialized = JSON.stringify(data);
		if (await adapter.exists(path)) {
			await adapter.write(path, serialized);
		} else {
			await this._plugin.app.vault.create(path, serialized);
		}
	}

	async remove(name: string): Promise<void> {
		if (name === DATA_FILE) {
			throw new Error(`${DATA_FILE} is managed by Obsidian and cannot be removed`);
		}

		await this._plugin.app.vault.adapter.remove(this.path(name));
	}

	private path(name: string): string {
		return `${this._plugin.manifest.dir}/${name}`;
	}
}
