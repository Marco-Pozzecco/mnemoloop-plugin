import { IYamlEngine } from '@/interfaces/parser/IYamlParser';
import { IEntityParser } from '@/interfaces/parser/IEntityParser';
import {
	ParseContentResult,
	ParseContentResultWithError,
	ParseContentResultWithSuccess,
	ParseResult,
	ParseResultWithError,
	ParseResultWithSuccess,
} from '@/interfaces/parser/utils';
import { NotFoundError } from '@/utils/errors';
import { Logger } from '@/utils/Logger';
import { normalizePath, Plugin, TFile, TFolder } from 'obsidian';
import { ZodError } from 'zod';

export abstract class EntityParser<
	Entity extends EntityYaml & { content: EntityContent },
	EntityYaml,
	EntityContent,
> implements IEntityParser<Entity, EntityYaml, EntityContent> {
	protected _plugin: Plugin;
	protected _yaml: IYamlEngine<EntityYaml>;

	constructor(plugin: Plugin, yamlEngine: IYamlEngine<EntityYaml>) {
		this._plugin = plugin;
		this._yaml = yamlEngine;
	}

	parseFile = async (filepath: string): Promise<ParseResult<Entity>> => {
		const normalizedPath = normalizePath(filepath);
		const file = this._plugin.app.vault.getAbstractFileByPath(normalizedPath);
		if (!(file instanceof TFile)) {
			const error = new NotFoundError(`File not found: ${normalizedPath}`);
			Logger.error(error.message);
			return {
				entity: null,
				filepath,
				stats: null,
				success: false,
				error,
			};
		}

		const content = await this._plugin.app.vault.read(file);

		let parsed;

		try {
			parsed = this._yaml.extractFmFromContent(content);
		} catch {
			const { data, success } = await this._yaml.recover(filepath);
			if (success) {
				parsed = { fm: data, body: content };
			} else {
				return this.parseResultError(filepath, new Error('Failed to recover YAML'));
			}
		}
		const contentResult = this.parseContent(content);

		if (!contentResult.success) return this.parseResultError(filepath, contentResult.error);

		const entity = { ...parsed.fm, content: { ...contentResult.entity } } as Entity;

		return this.parseResultSuccess(filepath, entity, file);
	};

	parseDir = async (dirPath: string): Promise<ParseResult<EntityYaml>[]> => {
		const normalizedDir = normalizePath(dirPath);
		const folder = this._plugin.app.vault.getAbstractFileByPath(normalizedDir);

		if (!(folder instanceof TFolder)) {
			return [];
		}

		const mdFiles = folder.children.filter(
			(f): f is TFile => f instanceof TFile && f.extension === 'md',
		);

		const results = await Promise.all(
			mdFiles.map(async (file): Promise<ParseResult<EntityYaml>> => {
				return await this.parseYaml(file.path);
			}),
		);
		return results;
	};

	parseEntity: (content: string) => ParseContentResult<Entity> = (content: string) => {
		try {
			const { fm } = this._yaml.extractFmFromContent(content);
			const parsedContent = this.parseContent(content);

			if (!parsedContent.success)
				return this.parseContentResultError(new Error('Failed to parse content'));

			const result = {
				...fm,
				content: {
					...parsedContent.entity,
				},
			} as Entity;

			return this.parseContentResultSuccess(result);
		} catch {
			return this.parseContentResultError(new Error(`Failed to parse entity from content`));
		}
	};

	serializeEntity: (entity: Entity) => ParseContentResult<string> = (entity) => {
		try {
			const yaml = this._yaml.encode(this.extractYamlMetadata(entity));
			const content = this.serializeContent(this.extractContentMetadata(entity), entity);

			if (!content.success) return this.parseContentResultError(content.error);

			return this.parseContentResultSuccess(`${yaml}\n${content.entity}`);
		} catch (e) {
			if (e instanceof ZodError) {
				return this.parseContentResultError(e);
			}
			return this.parseContentResultError(
				e instanceof Error ? e : new Error('Failed to serialize entity'),
			);
		}
	};

	parseYaml = async (filepath: string): Promise<ParseResult<EntityYaml>> => {
		const file = this._plugin.app.vault.getFileByPath(filepath);

		if (!file)
			return this.parseResultError(filepath, new NotFoundError(`File not found: ${filepath}`));

		let metadata;

		try {
			metadata = await this._yaml.extractFmFromFile(filepath);
		} catch {
			const { success, data } = await this._yaml.recover(filepath);
			if (success) {
				metadata = data;
			} else {
				return this.parseResultError(filepath, new Error(`Failed to recover: ${filepath}`));
			}
		}

		return this.parseResultSuccess(filepath, metadata, file);
	};

	parseYamlFromCache = (filepath: string): ParseResult<EntityYaml> => {
		try {
			const file = this._plugin.app.vault.getFileByPath(filepath);

			if (!file)
				return this.parseResultError(filepath, new NotFoundError(`File not found: ${filepath}`));

			const cached = this._yaml.extractFmFromCache(filepath);

			return this.parseResultSuccess(filepath, cached, file);
		} catch {
			return this.parseResultError(filepath, new Error(`No cached YAML found for: ${filepath}`));
		}
	};

	parseYamlFromContent = (content: string): ParseContentResult<EntityYaml> => {
		try {
			const { fm } = this._yaml.extractFmFromContent(content);
			return this.parseContentResultSuccess(fm);
		} catch {
			return this.parseContentResultError(new Error(`Failed to parse YAML from content`));
		}
	};

	serializeYaml: (yaml: EntityYaml) => ParseContentResult<string> = (yaml: EntityYaml) => {
		try {
			const yamlStr = this._yaml.encode(yaml);
			return this.parseContentResultSuccess(yamlStr);
		} catch {
			return this.parseContentResultError(new Error('Failed to serialize yaml'));
		}
	};

	abstract parseContent(content: string): ParseContentResult<EntityContent>;
	abstract serializeContent: (
		content: EntityContent,
		metadata?: Entity,
	) => ParseContentResult<string>;

	/**
	 * Uses zod internally, may throw
	 * @param entity
	 */
	protected abstract extractYamlMetadata(entity: Entity): EntityYaml;

	/**
	 * Uses zod internally, may throw
	 * @param entity
	 */
	protected abstract extractContentMetadata(entity: Entity): EntityContent;

	protected parseResultError(filepath: string, error: Error): ParseResultWithError {
		Logger.error(error.message);
		return {
			entity: null,
			stats: null,
			success: false,
			filepath,
			error,
		};
	}

	protected parseResultSuccess<Entity>(
		filepath: string,
		entity: Entity,
		file: TFile,
	): ParseResultWithSuccess<Entity> {
		const stats = {
			created_at: new Date(file.stat.ctime).toISOString(),
			updated_at: new Date(file.stat.mtime).toISOString(),
		};

		return {
			entity,
			stats,
			success: true,
			filepath,
		};
	}

	protected parseContentResultError(error: Error): ParseContentResultWithError {
		Logger.error(error.message);
		return {
			entity: null,
			success: false,
			error,
		};
	}

	protected parseContentResultSuccess<EntityContent>(
		entity: EntityContent,
	): ParseContentResultWithSuccess<EntityContent> {
		return {
			entity,
			success: true,
		};
	}
}
