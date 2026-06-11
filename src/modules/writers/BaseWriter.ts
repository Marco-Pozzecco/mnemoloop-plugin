import { IWriter } from '@/interfaces/IWriter';
import { IYamlEngine } from '@/interfaces/IYamlEngine';
import { normalizePath, Plugin, TFile } from 'obsidian';

export abstract class BaseWriter<
	Entity extends Record<string, unknown>,
	EntityMetadata,
	EntityBody = Record<string, unknown>,
> implements IWriter<Entity, EntityMetadata, EntityBody> {
	protected _plugin: Plugin;
	protected _yaml: IYamlEngine<EntityMetadata>;

	constructor(plugin: Plugin, yamlEngine: IYamlEngine<EntityMetadata>) {
		this._plugin = plugin;
		this._yaml = yamlEngine;
	}

	create: (filepath: string, entity: Entity) => Promise<void> = async (filepath, entity) => {
		if (await this.fileExists(filepath)) {
			throw new Error(`File already exists: ${filepath}`);
		}

		const body = this.extractBody(entity);
		const serializedBody = this.serializeBody(body);

		// Create file with body only; frontmatter will be added via processFrontMatter
		await this.writeFile(filepath, serializedBody);

		// Add frontmatter using processFrontMatter
		const metadata = this.extractMetadata(entity);
		const normalized = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${normalized}`);
		}
		await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			Object.assign(frontmatter, metadata);
		});
	};

	update: (filepath: string, entity: Entity) => Promise<void> = async (filepath, entity) => {
		if (!(await this.fileExists(filepath))) {
			throw new Error(`File not found: ${filepath}`);
		}

		const metadata = this.extractMetadata(entity);
		const body = this.extractBody(entity);
		const serializedBody = this.serializeBody(body);

		// Update frontmatter using processFrontMatter
		const normalized = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${normalized}`);
		}
		await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			Object.assign(frontmatter, metadata);
		});

		// Update body if changed
		const currentContent = await this.readFile(filepath);
		const currentBody = this.removeFrontmatter(currentContent);

		if (currentBody !== serializedBody) {
			// Write body-only, then restore frontmatter
			await this.writeFile(filepath, serializedBody);
			await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
				const targetKeys = this.getMetadataKeys();

				for (const key of Object.keys(frontmatter)) {
					if (!targetKeys.includes(key)) {
						delete frontmatter[key];
					}
				}

				Object.assign(frontmatter, metadata);
			});
		}
	};

	updateFrontmatter: (filepath: string, data: Partial<EntityMetadata>) => Promise<void> = async (
		filepath,
		data,
	) => {
		const normalized = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${normalized}`);
		}
		await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const targetKeys = this.getMetadataKeys();

			for (const key of Object.keys(frontmatter)) {
				if (!targetKeys.includes(key)) {
					delete frontmatter[key];
				}
			}

			Object.assign(frontmatter, data);
		});
	};

	updateBody: (filepath: string, body: EntityBody) => Promise<void> = async (filepath, body) => {
		const serializedBody = this.serializeBody(body);
		const currentContent = await this.readFile(filepath);
		const currentBody = this.removeFrontmatter(currentContent);

		if (currentBody !== serializedBody) {
			// Get current frontmatter from cache
			const normalized = normalizePath(filepath);
			const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
			let currentFm: Record<string, unknown> = {};
			if (file instanceof TFile) {
				const cache = this._plugin.app.metadataCache.getFileCache(file);
				currentFm = cache?.frontmatter || {};
			}

			// Write body-only
			await this.writeFile(filepath, serializedBody);

			// Restore frontmatter
			if (!(file instanceof TFile)) {
				throw new Error(`File not found: ${normalized}`);
			}
			await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
				Object.assign(frontmatter, currentFm);
			});
		}
	};

	delete: (filepath: string) => Promise<void> = async (filepath) => {
		const normalized = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalized);

		if (!file) {
			throw new Error(`File not found: ${normalized}`);
		}

		await this._plugin.app.vault.delete(file);
	};

	protected async fileExists(filepath: string): Promise<boolean> {
		const normalized = normalizePath(filepath);
		return this._plugin.app.vault.getAbstractFileByPath(normalized) !== null;
	}

	protected async readFile(filepath: string): Promise<string> {
		const normalized = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${normalized}`);
		}
		return this._plugin.app.vault.read(file);
	}

	protected async writeFile(filepath: string, content: string): Promise<void> {
		const normalized = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
		if (file instanceof TFile) {
			await this._plugin.app.vault.modify(file, content);
		} else {
			await this._plugin.app.vault.create(normalized, content);
		}
	}

	protected removeFrontmatter(content: string): string {
		if (!content.startsWith('---\n')) {
			return content;
		}
		const endIndex = content.indexOf('\n---\n', 4);
		if (endIndex !== -1) {
			return content.slice(endIndex + 5);
		}
		const altEndIndex = content.indexOf('\n---', 4);
		if (altEndIndex !== -1) {
			const body = content.slice(altEndIndex + 4);
			return body.startsWith('\n') ? body.slice(1) : body;
		}
		return content;
	}

	protected abstract serializeBody(body: EntityBody): string;
	protected abstract deserializeBody(content: string): EntityBody;
	protected abstract extractMetadata(entity: Entity): EntityMetadata;
	protected abstract extractBody(entity: Entity): EntityBody;
	protected abstract getMetadataKeys(): string[];
}
