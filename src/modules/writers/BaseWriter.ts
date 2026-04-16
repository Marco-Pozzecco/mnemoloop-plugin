import { IWriter } from '@/interfaces/IWriter';
import { IYamlEngine } from '@/interfaces/IYamlEngine';
import { normalizePath, Plugin } from 'obsidian';

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

		const metadata = this.extractMetadata(entity);
		const body = this.extractBody(entity);
		const serializedBody = this.serializeBody(body);
		const yamlStr = this._yaml.encode(metadata);
		const content = `${yamlStr}\n${serializedBody}`;

		await this.writeFile(filepath, content);
	};

	update: (filepath: string, entity: Entity) => Promise<void> = async (filepath, entity) => {
		if (!(await this.fileExists(filepath))) {
			throw new Error(`File not found: ${filepath}`);
		}

		const metadata = this.extractMetadata(entity);
		const body = this.extractBody(entity);
		const serializedBody = this.serializeBody(body);
		const yamlStr = this._yaml.encode(metadata);
		const content = `${yamlStr}\n${serializedBody}`;

		await this.writeFile(filepath, content);
	};

	updateFrontmatter: (filepath: string, data: Partial<EntityMetadata>) => Promise<void> = async (
		filepath,
		data,
	) => {
		const existing = await this.readFile(filepath);

		try {
			const extracted = this._yaml.extractFmFromContent(existing);
			const updatedMetadata = { ...extracted.fm, ...data };
			const bodyContent = extracted.body;
			const yamlStr = this._yaml.encode(updatedMetadata);
			const content = `${yamlStr}\n${bodyContent}`;

			await this.writeFile(filepath, content);
		} catch (error) {
			throw new Error(
				`Failed to parse frontmatter: ${error instanceof Error ? error.message : 'unknown error'}`,
			);
		}
	};

	updateBody: (filepath: string, body: EntityBody) => Promise<void> = async (filepath, body) => {
		const existing = await this.readFile(filepath);

		try {
			const extracted = this._yaml.extractFmFromContent(existing);
			const serializedBody = this.serializeBody(body);
			const yamlStr = this._yaml.encode(extracted.fm);
			const content = `${yamlStr}\n${serializedBody}`;

			await this.writeFile(filepath, content);
		} catch (error) {
			throw new Error(
				`Failed to parse frontmatter: ${error instanceof Error ? error.message : 'unknown error'}`,
			);
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
		return this._plugin.app.vault.adapter.exists(normalized);
	}

	protected async readFile(filepath: string): Promise<string> {
		const normalized = normalizePath(filepath);
		if (!(await this.fileExists(normalized))) {
			throw new Error(`File not found: ${normalized}`);
		}
		return this._plugin.app.vault.adapter.read(normalized);
	}

	protected async writeFile(filepath: string, content: string): Promise<void> {
		const normalized = normalizePath(filepath);
		await this._plugin.app.vault.adapter.write(normalized, content);
	}

	protected abstract serializeBody(body: EntityBody): string;
	protected abstract deserializeBody(content: string): EntityBody;
	protected abstract extractMetadata(entity: Entity): EntityMetadata;
	protected abstract extractBody(entity: Entity): EntityBody;
}
