import { IWriter } from '@/interfaces/IWriter';
import { IEntityParser } from '@/interfaces/parser/IEntityParser';
import { Logger } from '@/utils/Logger';
import { normalizePath, Plugin, TFile } from 'obsidian';

export abstract class BaseWriter<
	Entity extends EntityMetadata & { content: EntityBody },
	EntityMetadata,
	EntityBody,
> implements IWriter<Entity, EntityMetadata, EntityBody> {
	protected _plugin: Plugin;
	protected _parser: IEntityParser<Entity, EntityMetadata, EntityBody>;

	constructor(plugin: Plugin, parser: IEntityParser<Entity, EntityMetadata, EntityBody>) {
		this._plugin = plugin;
		this._parser = parser;
	}

	create: (filepath: string, entity: Entity) => Promise<void> = async (filepath, entity) => {
		try {
			if (this.fileExists(filepath)) {
				throw new Error(`File already exists: ${filepath}`);
			}

			const result = this._parser.serializeEntity(entity);

			if (!result.success) {
				throw result.error;
			}

			await this.writeFile(filepath, result.entity);
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : String(e));
		}
	};

	update: (filepath: string, entity: Partial<Entity>) => Promise<void> = async (
		filepath,
		entity,
	) => {
		try {
			if (!this.fileExists(filepath)) {
				throw new Error(`File not found: ${filepath}`);
			}

			const current = await this._parser.parseFile(filepath);

			if (!current.success) {
				throw current.error;
			}

			const updated = {
				...current.entity,
				...entity,
			};

			const metadata = this.extractMetadata(updated);
			const body = this.extractBody(updated);
			const serializedBody = this._parser.serializeContent(body);

			if (!serializedBody.success) {
				throw serializedBody.error;
			}

			// Update frontmatter using processFrontMatter
			const normalized = normalizePath(filepath);
			const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
			if (!(file instanceof TFile)) {
				throw new Error(`File not found: ${normalized}`);
			}
			await this._plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter: Record<string, unknown>) => {
					Object.assign(frontmatter, metadata);
				},
			);

			// Update body if changed
			const currentContent = await this.readFile(filepath);
			const currentBody = this.removeFrontmatter(currentContent);

			if (currentBody !== serializedBody.entity) {
				// Write body-only, then restore frontmatter
				await this.writeFile(filepath, serializedBody.entity);
				await this._plugin.app.fileManager.processFrontMatter(
					file,
					(frontmatter: Record<string, unknown>) => {
						const targetKeys = this.getMetadataKeys();

						for (const key of Object.keys(frontmatter)) {
							if (!targetKeys.includes(key)) {
								delete frontmatter[key];
							}
						}

						Object.assign(frontmatter, metadata);
					},
				);
			}
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : String(e));
		}
	};

	updateFrontmatter: (filepath: string, data: Partial<EntityMetadata>) => Promise<void> = async (
		filepath,
		data,
	) => {
		try {
			const normalized = normalizePath(filepath);
			const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
			if (!(file instanceof TFile)) {
				throw new Error(`File not found: ${normalized}`);
			}
			await this._plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter: Record<string, unknown>) => {
					const targetKeys = this.getMetadataKeys();

					for (const key of Object.keys(frontmatter)) {
						if (!targetKeys.includes(key)) {
							delete frontmatter[key];
						}
					}

					Object.assign(frontmatter, data);
				},
			);
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : String(e));
		}
	};

	updateBody: (filepath: string, body: EntityBody) => Promise<void> = async (filepath, body) => {
		try {
			const serializedBody = this._parser.serializeContent(body);

			if (!serializedBody.success) {
				return;
			}

			const currentContent = await this.readFile(filepath);
			const currentBody = this.removeFrontmatter(currentContent);

			if (currentBody !== serializedBody.entity) {
				// Get current frontmatter from cache
				const normalized = normalizePath(filepath);
				const file = this._plugin.app.vault.getAbstractFileByPath(normalized);
				let currentFm: Record<string, unknown> = {};
				if (file instanceof TFile) {
					const cache = this._plugin.app.metadataCache.getFileCache(file);
					currentFm = cache?.frontmatter || {};
				}

				// Write body-only
				await this.writeFile(filepath, serializedBody.entity);

				// Restore frontmatter
				if (!(file instanceof TFile)) {
					throw new Error(`File not found: ${normalized}`);
				}
				await this._plugin.app.fileManager.processFrontMatter(
					file,
					(frontmatter: Record<string, unknown>) => {
						Object.assign(frontmatter, currentFm);
					},
				);
			}
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : String(e));
		}
	};

	delete: (filepath: string) => Promise<void> = async (filepath) => {
		try {
			const normalized = normalizePath(filepath);
			const file = this._plugin.app.vault.getAbstractFileByPath(normalized);

			if (!file) {
				throw new Error(`File not found: ${normalized}`);
			}

			await this._plugin.app.fileManager.trashFile(file);
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : String(e));
		}
	};

	protected fileExists(filepath: string): boolean {
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

	protected abstract extractMetadata(entity: Entity): EntityMetadata;
	protected abstract extractBody(entity: Entity): EntityBody;
	protected abstract getMetadataKeys(): string[];
}
