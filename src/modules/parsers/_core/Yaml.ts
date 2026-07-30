import { IYamlEngine } from '@/interfaces/parser/IYamlParser';
import { RecoverResult } from '@/interfaces/parser/utils';
import { ERROR_MESSAGES } from '@/utils/constants';
import { Logger } from '@/utils/Logger';
import { normalizePath, parseYaml, Plugin } from 'obsidian';
import { ZodType } from 'zod';

export abstract class YamlParser<
	EntityYaml extends Record<string, unknown>,
> implements IYamlEngine<EntityYaml> {
	protected _plugin: Plugin;
	protected _schema: ZodType<EntityYaml>;
	protected _yamlRegex = /^---\n[\s\S]*?\n---\n?/;

	constructor(plugin: Plugin, schema: ZodType<EntityYaml>) {
		this._plugin = plugin;
		this._schema = schema;
	}

	abstract recover(filepath: string): Promise<RecoverResult<EntityYaml>>;

	async extractFmFromFile(filepath: string): Promise<EntityYaml> {
		const normalizedFilepath = normalizePath(filepath);
		const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);

		if (!file) {
			throw new Error('file not found');
		}

		let fm: EntityYaml = {} as EntityYaml;

		await this._plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			Object.assign(fm, frontmatter);
		});

		fm = this.validate(fm);

		return fm;
	}

	extractFmFromContent(content: string): { fm: EntityYaml; body: string } {
		const match = content.match(this._yamlRegex);

		if (!match) {
			throw new Error(ERROR_MESSAGES.INVALID_YAML);
		}

		const yamlContent = match[0].replace(/^---\n/, '').replace(/\n---\n?$/, '');

		const frontmatter = parseYaml(yamlContent) as Record<string, unknown>;
		const metadata = this.validate(frontmatter);
		const body = this.removeFrontmatter(content);

		return { fm: metadata, body };
	}

	extractFmFromCache(filepath: string): EntityYaml {
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

	async write(filepath: string, data: EntityYaml): Promise<void> {
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
		const { success, data: result, error } = this._schema.safeParse(data);
		if (!success) {
			Logger.error('validate:', error);
			throw error;
		}
		return result;
	}

	protected removeFrontmatter(content: string): string {
		const match = content.match(this._yamlRegex);
		return match ? content.slice(match[0].length) : content;
	}

	encode(data: EntityYaml): string {
		const lines: string[] = [];
		const parsed = this.validate(data);
		const entries = Object.entries(parsed);

		lines.push('---');

		for (const [key, value] of entries) {
			if (value === undefined) continue;
			if (typeof value === 'object') {
				lines.push(`${key}: ${JSON.stringify(value)}`);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-base-to-string -- value is not an object here (checked above)
				lines.push(`${key}: ${String(value)}`);
			}
		}

		lines.push('---');

		return lines.join('\n');
	}

	decode(yaml: string): EntityYaml {
		const parsed = parseYaml(yaml) as Record<string, unknown>;
		return this.validate(parsed);
	}
}
