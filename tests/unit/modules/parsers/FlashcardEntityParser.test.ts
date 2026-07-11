import { IContentParser } from '@/interfaces/parser/IContentParser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';
import { FlashcardBasicContentParser } from '@/modules/parsers/content/FlashcardBasicContentParser';
import { FlashcardSequenceContentParser } from '@/modules/parsers/content/FlashcardSequenceContentParser';
import { FlashcardYamlParser } from '@/modules/parsers/yaml/FlashcardYamlParser';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';
import { CardType, FlashcardContent, FlashcardYaml } from '@/schemas';
import { FlashcardBaseContent, FlashcardBaseSchema } from '@/schemas/flashcard.base';
import { FlashcardSequenceContent } from '@/schemas/flashcard.sequence';
import { RecoverResult } from '@/interfaces/parser/utils';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardYaml } from '../../../helpers/factories';
import { ERROR_MESSAGES } from '@/utils/constants';

describe('FlashcardEntityParser', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let settings: IAdapter<PluginSettings>;
	let parser: FlashcardParser;
	let yamlEngine: FlashcardYamlParser;
	let contentParsers: IContentParser<FlashcardContent>[];
	beforeEach(() => {
		plugin = createMockPlugin([
			{ path: 'test.md', content: '---\n---\n' },
			{ path: 'bad.md', content: '---\n---\n' },
		]);
		settings = {
			data: {
				flashcard: {
					marker: '?',
					watch: { directory: '/flashcards', tags: ['#flashcard'] },
				},
				debounce_timeout_ms: 500,
				enable_soft_delete: true,
				soft_delete_hours: 24,
			},
		} as IAdapter<PluginSettings>;
		yamlEngine = new FlashcardYamlParser(plugin as unknown as Plugin);
		contentParsers = [
			new FlashcardBasicContentParser(settings),
			new FlashcardSequenceContentParser(settings),
		] as unknown as IContentParser<FlashcardContent>[];
		parser = new FlashcardParser(plugin as unknown as Plugin, contentParsers, yamlEngine);
	});

	describe('parseYaml', () => {
		it('should return metadata for valid file', async () => {
			const yaml = createFlashcardYaml({ uuid: 'abc-123' });
			vi.spyOn(parser['_yaml'], 'extractFmFromFile').mockResolvedValue(yaml);

			const result = await parser.parseYaml('test.md');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.entity.uuid).toBe('abc-123');
			}
			expect(result.filepath).toBe('test.md');
		});

		it('should recover and retry on first failure', async () => {
			const yaml = createFlashcardYaml({ uuid: 'recovered' });
			vi.spyOn(parser['_yaml'], 'extractFmFromFile').mockRejectedValueOnce(
				new Error('Invalid YAML'),
			);
			const recoverSpy = vi
				.spyOn(parser['_yaml'], 'recover')
				.mockResolvedValue({ data: yaml, success: true } as RecoverResult<FlashcardYaml>);

			const result = await parser.parseYaml('test.md');

			expect(recoverSpy).toHaveBeenCalledWith('test.md');
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.entity.uuid).toBe('recovered');
			}
		});

		it('should return default entity after max retries exceeded', async () => {
			vi.spyOn(parser['_yaml'], 'extractFmFromFile').mockRejectedValue(
				new Error('always fail'),
			);
			const recoverSpy = vi
				.spyOn(parser['_yaml'], 'recover')
				.mockResolvedValue({ data: null, success: false } as RecoverResult<FlashcardYaml>);

			const result = await parser.parseYaml('bad.md');

			expect(recoverSpy).toHaveBeenCalledTimes(1);
			expect(result.filepath).toBe('bad.md');
		});
	});

	describe('parseContent', () => {
		it('should split content into front and back using marker', () => {
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'Front content\n\n?\n\nBack content',
			});

			const result = parser.parseContent('ignored');

			expect(result.success).toBe(true);
			if (result.success) {
				const content = result.entity as FlashcardBaseContent;
				expect(content.front).toBe('Front content');
				expect(content.back).toBe('Back content');
			}
		});

		it('should handle marker with regex special characters like *', () => {
			settings.data.flashcard.marker = '**';
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				yamlEngine,
			);
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'Front\n\n**\n\nBack',
			});

			const result = parser.parseContent('ignored');

			expect(result.success).toBe(true);
			if (result.success) {
				const content = result.entity as FlashcardBaseContent;
				expect(content.front).toBe('Front');
				expect(content.back).toBe('Back');
			}
		});

		it('should handle marker with regex special characters like [', () => {
			settings.data.flashcard.marker = '[split]';
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				yamlEngine,
			);
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'Front\n\n[split]\n\nBack',
			});

			const result = parser.parseContent('ignored');

			expect(result.success).toBe(true);
			if (result.success) {
				const content = result.entity as FlashcardBaseContent;
				expect(content.front).toBe('Front');
				expect(content.back).toBe('Back');
			}
		});

		it('should return error result when marker is not found', () => {
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'No marker here',
			});

			const result = parser.parseContent('ignored');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe(ERROR_MESSAGES.MISSING_MARKER);
			}
		});

		it('should parse sequence content when frontmatter has card_type: sequence', () => {
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml({ card_type: CardType.Sequence }),
				body: 'Intro text\n\n?\n\n1. Step one\n2. Step two\n3. Step three',
			});

			const result = parser.parseContent('ignored');

			expect(result.success).toBe(true);
			if (result.success) {
				expect((result.entity as FlashcardSequenceContent).steps).toEqual([
					'Step one',
					'Step two',
					'Step three',
				]);
			}
		});
	});

	describe('parse', () => {
		it('should parse file with frontmatter and body', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				yamlEngine,
			);
			const yaml = createFlashcardYaml({ uuid: 'abc' });
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: yaml,
				body: 'Front\n\n?\n\nBack',
			});

			const result = await parser.parseFile('test.md');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.entity.uuid).toBe('abc');
				const content = (result.entity as FlashcardBaseSchema).content;
				expect(content.front).toBe('Front');
				expect(content.back).toBe('Back');
			}
			expect(result.filepath).toBe('test.md');
		});

		it('should recover and retry on first failure', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				yamlEngine,
			);
			const yaml = createFlashcardYaml({ uuid: 'recovered' });
			vi.spyOn(parser['_yaml'], 'extractFmFromContent')
				.mockImplementationOnce(() => {
					throw new Error('fail');
				})
				.mockReturnValueOnce({ fm: yaml, body: 'Front\n\n?\n\nBack' });
			const recoverSpy = vi
				.spyOn(parser['_yaml'], 'recover')
				.mockResolvedValue({ data: yaml, success: true } as RecoverResult<FlashcardYaml>);

			const result = await parser.parseFile('test.md');

			expect(recoverSpy).toHaveBeenCalledWith('test.md');
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.entity.uuid).toBe('recovered');
				expect((result.entity as FlashcardBaseSchema).content.front).toBe('Front');
			}
		});

		it('should return error result after max retries exhausted', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				yamlEngine,
			);
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockImplementation(() => {
				throw new Error('fail');
			});
			vi.spyOn(parser['_yaml'], 'recover').mockResolvedValue({
				data: null,
				success: false,
			} as RecoverResult<FlashcardYaml>);

			const result = await parser.parseFile('test.md');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('Failed to recover');
			}
		});

		it('should recover once and return success', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				yamlEngine,
			);
			const yaml = createFlashcardYaml({ uuid: '88888888-8888-1888-8888-888888888888' });
			vi.spyOn(parser['_yaml'], 'extractFmFromContent')
				.mockImplementationOnce(() => {
					throw new Error('first fail');
				})
				.mockReturnValueOnce({ fm: yaml, body: 'Front\n\n?\n\nBack' });
			vi.spyOn(parser['_yaml'], 'recover').mockResolvedValue({
				data: yaml,
				success: true,
			} as RecoverResult<FlashcardYaml>);

			const result = await parser.parseFile('test.md');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.entity.uuid).toBe('88888888-8888-1888-8888-888888888888');
			}
		});
	});

	describe('parseAll', () => {
		it('should return empty array for non-existent directory', async () => {
			const result = await parser.parseDir('/missing');

			expect(result).toEqual([]);
		});

		it('should parse all markdown files in directory', async () => {
			plugin = createMockPlugin([
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
			const localYamlEngine = new FlashcardYamlParser(plugin as unknown as Plugin);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				localYamlEngine,
			);
			const parseSpy = vi.spyOn(parser, 'parseYaml').mockImplementation(
				async (filepath: string) => ({
					entity: createFlashcardYaml({
						uuid: filepath.endsWith('/a.md')
							? 'aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa'
							: 'bbbbbbbb-bbbb-1bbb-8bbb-bbbbbbbbbbbb',
					}),
					filepath,
					stats: { created_at: '', updated_at: '' },
					success: true,
				}),
			);

			const result = await parser.parseDir('/flashcards');

			expect(parseSpy).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(2);
			const uuids = result.map((r) => r.entity!.uuid);
			expect(uuids).toContain('aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa');
			expect(uuids).toContain('bbbbbbbb-bbbb-1bbb-8bbb-bbbbbbbbbbbb');
		});

		it('should ignore non-markdown files', async () => {
			plugin = createMockPlugin([
				{ path: '/flashcards/note.md', content: '---\n---\n' },
				{ path: '/flashcards/image.png', content: 'binary' },
			]);
			plugin.app.vault.adapter.exists = vi
				.fn()
				.mockImplementation(
					async (path: string) =>
						path === '/flashcards' ||
						['/flashcards/note.md', '/flashcards/image.png'].includes(path),
				);
			const localYamlEngine = new FlashcardYamlParser(plugin as unknown as Plugin);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				localYamlEngine,
			);
			vi.spyOn(parser, 'parseYaml').mockImplementation(async () => ({
				entity: createFlashcardYaml({ uuid: '11111111-1111-1111-8111-111111111111' }),
				filepath: '/flashcards/note.md',
				stats: { created_at: '', updated_at: '' },
				success: true,
			}));

			const result = await parser.parseDir('/flashcards');

			expect(result).toHaveLength(1);
			expect(result[0].entity!.uuid).toBe('11111111-1111-1111-8111-111111111111');
		});

		it('should return successful results when some files fail to parse', async () => {
			plugin = createMockPlugin([
				{ path: '/flashcards/good.md', content: '---\n---\n' },
				{ path: '/flashcards/bad.md', content: '---\n---\n' },
				{ path: '/flashcards/also-good.md', content: '---\n---\n' },
			]);
			plugin.app.vault.adapter.exists = vi
				.fn()
				.mockImplementation(
					async (path: string) =>
						path === '/flashcards' ||
						['/flashcards/good.md', '/flashcards/bad.md', '/flashcards/also-good.md'].includes(
							path,
						),
				);
			const localYamlEngine = new FlashcardYamlParser(plugin as unknown as Plugin);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				localYamlEngine,
			);
			vi.spyOn(parser, 'parseYaml').mockImplementation(async (filepath: string) => {
				if (filepath === '/flashcards/bad.md') {
					return {
						entity: null,
						filepath,
						stats: null,
						success: false,
						error: new Error('bad file'),
					};
				}
				return {
					entity: createFlashcardYaml({
						uuid: filepath.includes('also-good')
							? '33333333-3333-1333-8333-333333333333'
							: '22222222-2222-1222-8222-222222222222',
					}),
					filepath,
					stats: { created_at: '', updated_at: '' },
					success: true,
				};
			});

			const result = await parser.parseDir('/flashcards');

			expect(result).toHaveLength(3);
			const successResults = result.filter((r) => r.success);
			expect(successResults).toHaveLength(2);
			const uuids = successResults.map((r) => r.entity!.uuid);
			expect(uuids).toContain('22222222-2222-1222-8222-222222222222');
			expect(uuids).toContain('33333333-3333-1333-8333-333333333333');
		});

		it('should call parseMetadata on each markdown file', async () => {
			plugin = createMockPlugin([{ path: '/flashcards/x.md', content: '---\n---\n' }]);
			plugin.app.vault.adapter.exists = vi
				.fn()
				.mockImplementation(
					async (path: string) => path === '/flashcards' || path === '/flashcards/x.md',
				);
			const localYamlEngine = new FlashcardYamlParser(plugin as unknown as Plugin);
			parser = new FlashcardParser(
				plugin as unknown as Plugin,
				contentParsers,
				localYamlEngine,
			);
			const parseSpy = vi.spyOn(parser, 'parseYaml').mockResolvedValue({
				entity: createFlashcardYaml({ uuid: '99999999-9999-1999-8999-999999999999' }),
				filepath: '/flashcards/x.md',
				stats: { created_at: '', updated_at: '' },
				success: true,
			});

			await parser.parseDir('/flashcards');

			expect(parseSpy).toHaveBeenCalledWith('/flashcards/x.md');
		});
	});
});
