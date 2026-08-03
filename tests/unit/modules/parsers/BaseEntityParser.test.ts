import { describe, expect, it, vi } from 'vitest';
import { Plugin } from 'obsidian';
import { EntityParser } from '@/modules/parsers/_core/Entity';
import { IContentParser } from '@/interfaces/parser/IContentParser';
import { IYamlEngine } from '@/interfaces/parser/IYamlParser';
import { CardType, Flashcard, FlashcardContent, FlashcardYaml, FlashcardYamlSchema } from '@/schemas';
import { ParseContentResult, RecoverResult } from '@/interfaces/parser/utils';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardYaml } from '../../../helpers/factories';

class TestContentParser implements IContentParser<FlashcardContent> {
	readonly cardType = CardType.Basic;
	parse = (_body: string): ParseContentResult<FlashcardContent> => ({
		entity: { meta_type: CardType.Basic as const, front: '', back: '' },
		success: true,
	});
	serialize = (_content: FlashcardContent): ParseContentResult<string> => ({
		entity: '',
		success: true,
	});
}

class TestYamlEngine implements IYamlEngine<FlashcardYaml> {
	encode = () => '';
	decode = () => ({ uuid: 'test' }) as unknown as FlashcardYaml;
	extractFmFromFile = async () => createFlashcardYaml();
	extractFmFromCache = () => createFlashcardYaml();
	extractFmFromContent = () => ({
		fm: createFlashcardYaml(),
		body: '',
	});
	write = async () => {};
	recover = async (): Promise<RecoverResult<FlashcardYaml>> => ({
		data: createFlashcardYaml(),
		success: true,
	});
	validate = (data: Record<string, unknown>) => data as unknown as FlashcardYaml;
}

class ConcreteEntityParser extends EntityParser<Flashcard, FlashcardYaml, FlashcardContent> {
	constructor(
		plugin: Plugin,
		contentParsers: IContentParser<FlashcardContent>[],
		yamlEngine?: IYamlEngine<FlashcardYaml>,
	) {
		super(plugin, yamlEngine ?? new TestYamlEngine());
	}

	parseContent = (_content: string): ParseContentResult<FlashcardContent> => ({
		entity: { meta_type: CardType.Basic as const, front: '', back: '' },
		success: true,
	});

	serializeContent = (_content: FlashcardContent): ParseContentResult<string> => ({
		entity: '',
		success: true,
	});

	protected extractYamlMetadata(entity: Flashcard): FlashcardYaml {
		return FlashcardYamlSchema.parse(entity);
	}

	protected extractContentMetadata(entity: Flashcard): FlashcardContent {
		return entity.content;
	}
}

describe('EntityParser', () => {
	describe('parseYaml', () => {
		it('should return metadata for valid file', async () => {
			const plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			const yaml = createFlashcardYaml({ uuid: 'abc-123' });
			const engine = new TestYamlEngine();
			vi.spyOn(engine, 'extractFmFromFile').mockResolvedValue(yaml);

			const parser = new ConcreteEntityParser(
				plugin as unknown as Plugin,
				[new TestContentParser()],
				engine,
			);

			const result = await parser.parseYaml('test.md');

			if (result.success) expect(result.entity.uuid).toBe('abc-123');
			expect(result.filepath).toBe('test.md');
		});

		it('should return error when file not found', async () => {
			const plugin = createMockPlugin([]);
			const parser = new ConcreteEntityParser(
				plugin as unknown as Plugin,
				[new TestContentParser()],
				new TestYamlEngine(),
			);

			const result = await parser.parseYaml('missing.md');

			expect(result.success).toBe(false);
			expect(result.filepath).toBe('missing.md');
		});
	});

	describe('parseDir', () => {
		it('should return empty array for non-existent directory', async () => {
			const plugin = createMockPlugin([]);
			const parser = new ConcreteEntityParser(
				plugin as unknown as Plugin,
				[new TestContentParser()],
				new TestYamlEngine(),
			);

			const result = await parser.parseDir('/missing');

			expect(result).toEqual([]);
		});

		it('should parse all markdown files in directory', async () => {
			const plugin = createMockPlugin([
				{ path: '/flashcards/a.md', content: '---\n---\n' },
				{ path: '/flashcards/b.md', content: '---\n---\n' },
				{ path: '/flashcards/c.txt', content: 'not markdown' },
			]);
			plugin.app.vault.adapter.exists = vi
				.fn()
				.mockImplementation(
					async (path: string) =>
						path === '/flashcards' ||
						['/flashcards/a.md', '/flashcards/b.md', '/flashcards/c.txt'].includes(path),
				);

			const parser = new ConcreteEntityParser(
				plugin as unknown as Plugin,
				[new TestContentParser()],
				new TestYamlEngine(),
			);
			const spy = vi.spyOn(parser, 'parseYaml').mockImplementation(async (filepath) => ({
				entity: createFlashcardYaml({
					uuid: (filepath as string).endsWith('/a.md')
						? 'aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa'
						: 'bbbbbbbb-bbbb-1bbb-8bbb-bbbbbbbbbbbb',
				}),
				filepath: filepath as string,
				success: true as const,
				stats: { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
			}));

			const result = await parser.parseDir('/flashcards');

			expect(spy).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(2);
			const uuids = result.map((r) => (r.success ? r.entity.uuid : null));
			expect(uuids).toContain('aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa');
			expect(uuids).toContain('bbbbbbbb-bbbb-1bbb-8bbb-bbbbbbbbbbbb');
		});

		it('should include failed results in output', async () => {
			const plugin = createMockPlugin([
				{ path: '/flashcards/good.md', content: '---\n---\n' },
				{ path: '/flashcards/bad.md', content: '---\n---\n' },
			]);
			plugin.app.vault.adapter.exists = vi
				.fn()
				.mockImplementation(
					async (path: string) =>
						path === '/flashcards' || ['/flashcards/good.md', '/flashcards/bad.md'].includes(path),
				);

			const parser = new ConcreteEntityParser(
				plugin as unknown as Plugin,
				[new TestContentParser()],
				new TestYamlEngine(),
			);
			vi.spyOn(parser, 'parseYaml').mockImplementation(async (filepath) => {
				if (filepath === '/flashcards/bad.md') {
				return {
					entity: null,
					filepath,
					success: false as const,
					stats: null,
					error: new Error('bad file'),
				};
				}
				return {
					entity: createFlashcardYaml({ uuid: '22222222-2222-1222-8222-222222222222' }),
					filepath: filepath as string,
					success: true as const,
					stats: { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
				};
			});

			const result = await parser.parseDir('/flashcards');

			expect(result).toHaveLength(2);
			const successResults = result.filter((r) => r.success);
			expect(successResults).toHaveLength(1);
			expect(successResults[0].entity.uuid).toBe('22222222-2222-1222-8222-222222222222');
			const errorResults = result.filter((r) => !r.success);
			expect(errorResults).toHaveLength(1);
			expect(errorResults[0].filepath).toBe('/flashcards/bad.md');
		});
	});
});
