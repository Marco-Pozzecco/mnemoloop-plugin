import { IYamlEngine } from '@/interfaces/IYamlEngine';
import { ERROR_MESSAGES } from '@/utils/constants';
import { normalizePath, parseYaml, Plugin } from 'obsidian';
import { ZodType } from 'zod';
import { $ZodTypeInternals } from 'zod/v4/core';

export abstract class BaseYamlEngine<T extends Record<string, unknown>> implements IYamlEngine<T> {
	protected _plugin: Plugin;
	protected _schema: ZodType<T, unknown, $ZodTypeInternals<T, unknown>>;
	protected _yamlRegex = /^---\n[\s\S]*?\n---\n?/;

	constructor(plugin: Plugin, schema: ZodType<T>) {
		this._plugin = plugin;
		this._schema = schema;
	}

	abstract recover: (filepath: string) => Promise<void>;

	async extractFmFromFile(filepath: string): Promise<T> {
		const normalizedFilepath = normalizePath(filepath);
		const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);

		if (!file) {
			throw new Error('file not found');
		}

		let fm: T = {} as T;

		await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			Object.assign(fm, frontmatter);
		});

		fm = this.validate(fm);

		return fm;
	}

	extractFmFromContent(content: string): { fm: T; body: string } {
		const match = content.match(this._yamlRegex);

		if (!match) {
			throw new Error(ERROR_MESSAGES.INVALID_YAML);
		}

		const yamlContent = match[0].replace(/^---\n/, '').replace(/\n---\n?$/, '');

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const frontmatter: Record<string, unknown> = parseYaml(yamlContent);
		const metadata = this.validate(frontmatter);
		const body = this.removeFrontmatter(content);

		return { fm: metadata, body };
	}

	extractFmFromCache(filepath: string): T {
		const normalizedFilepath = normalizePath(filepath);
		const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);

		if (!file) {
			throw new Error('file not found');
		}

		const metadata = this._plugin.app.metadataCache.getFileCache(file);

		if (!metadata || !metadata.frontmatter) {
			throw new Error(ERROR_MESSAGES.INVALID_YAML);
		}

		const fm = metadata.frontmatter;
		const entityMetadata = this.validate(fm);

		return entityMetadata;
	}

	async write(filepath: string, data: T): Promise<void> {
		const normalizedFilepath = normalizePath(filepath);
		const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);

		if (!file) {
			throw new Error('file not found');
		}

		await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			Object.assign(frontmatter, data);
		});
	}

	validate(data: Record<string, unknown>) {
		return this._schema.parse(data);
	}

	protected removeFrontmatter(content: string): string {
		const match = content.match(this._yamlRegex);
		return match ? content.slice(match[0].length) : content;
	}

	encode(data: T): string {
		const lines: string[] = [];
		const parsed = this.validate(data);
		const entries = Object.entries(parsed);

		lines.push('---');

		for (const [key, value] of entries) {
			if (value === undefined) continue;
			if (typeof value === 'object') {
				lines.push(`${key}: ${JSON.stringify(value)}`);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-base-to-string
				lines.push(`${key}: ${String(value)}`);
			}
		}

		lines.push('---');

		return lines.join('\n');
	}

	decode(yaml: string): T {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed: Record<string, unknown> = parseYaml(yaml);
		return this.validate(parsed);
	}
}
