import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { FlashcardParser } from '@/modules/parsers/FlashcardParser';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardYaml } from '../../../helpers/factories';
import { ERROR_MESSAGES } from '@/utils/constants';

describe('FlashcardParser', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let settings: IAdapter<PluginSettings>;
	let parser: FlashcardParser;

	beforeEach(() => {
		plugin = createMockPlugin([]);
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
		parser = new FlashcardParser(plugin as unknown as Plugin, settings);
	});

	describe('marker', () => {
		it('should return marker from settings', () => {
			expect(parser.marker).toBe('?');
		});

		it('should reflect settings marker changes', () => {
			settings.data.flashcard.marker = '??';
			expect(parser.marker).toBe('??');
		});
	});

	describe('parseMetadata', () => {
		it('should return metadata for valid file', async () => {
			const yaml = createFlashcardYaml({ uuid: 'abc-123' });
			vi.spyOn(parser['_yaml'], 'extractFmFromFile').mockResolvedValue(yaml);

			const result = await parser.parseMetadata('test.md');

			expect(result.entity.uuid).toBe('abc-123');
			expect(result.filepath).toBe('test.md');
		});

		it('should recover and retry on first failure', async () => {
			const yaml = createFlashcardYaml({ uuid: 'recovered' });
			vi.spyOn(parser['_yaml'], 'extractFmFromFile')
				.mockRejectedValueOnce(new Error('Invalid YAML'))
				.mockResolvedValueOnce(yaml);
			const recoverSpy = vi.spyOn(parser['_yaml'], 'recover').mockResolvedValue(undefined);

			const result = await parser.parseMetadata('test.md');

			expect(recoverSpy).toHaveBeenCalledWith('test.md');
			expect(result.entity.uuid).toBe('recovered');
		});

		it('should retry indefinitely when recovery keeps failing', async () => {
			// NOTE: parseMetadata() has no retry limit — it recurses forever if
			// extractFmFromFile always throws. This test verifies the documented
			// behavior with a mocked third-attempt success to avoid infinite loop.
			const yaml = createFlashcardYaml({ uuid: 'third-time-lucky' });
			vi.spyOn(parser['_yaml'], 'extractFmFromFile')
				.mockRejectedValueOnce(new Error('fail 1'))
				.mockRejectedValueOnce(new Error('fail 2'))
				.mockResolvedValueOnce(yaml);
			const recoverSpy = vi.spyOn(parser['_yaml'], 'recover').mockResolvedValue(undefined);

			const result = await parser.parseMetadata('test.md');

			expect(recoverSpy).toHaveBeenCalledTimes(2);
			expect(result.entity.uuid).toBe('third-time-lucky');
		});
	});

	describe('parseContent', () => {
		it('should split content into front and back using marker', () => {
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'Front content\n\n?\n\nBack content',
			});

			const result = parser.parseContent('ignored');

			expect(result.entity.front).toBe('Front content');
			expect(result.entity.back).toBe('Back content');
		});

		it('should handle marker with regex special characters like *', () => {
			settings.data.flashcard.marker = '**';
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'Front\n\n**\n\nBack',
			});

			const result = parser.parseContent('ignored');

			expect(result.entity.front).toBe('Front');
			expect(result.entity.back).toBe('Back');
		});

		it('should handle marker with regex special characters like [', () => {
			settings.data.flashcard.marker = '[split]';
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'Front\n\n[split]\n\nBack',
			});

			const result = parser.parseContent('ignored');

			expect(result.entity.front).toBe('Front');
			expect(result.entity.back).toBe('Back');
		});

		it('should throw when marker is not found', () => {
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: createFlashcardYaml(),
				body: 'No marker here',
			});

			expect(() => parser.parseContent('ignored')).toThrow(ERROR_MESSAGES.MISSING_MARKER);
		});
	});

	describe('parse', () => {
		it('should parse file with frontmatter and body', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			const yaml = createFlashcardYaml({ uuid: 'abc' });
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockReturnValue({
				fm: yaml,
				body: 'Front\n\n?\n\nBack',
			});

			const result = await parser.parse('test.md');

			expect(result.entity.uuid).toBe('abc');
			expect(result.entity.front).toBe('Front');
			expect(result.entity.back).toBe('Back');
			expect(result.filepath).toBe('test.md');
		});

		it('should recover and retry on first failure', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			const yaml = createFlashcardYaml({ uuid: 'recovered' });
			vi.spyOn(parser['_yaml'], 'extractFmFromContent')
				.mockImplementationOnce(() => {
					throw new Error('fail');
				})
				.mockReturnValueOnce({ fm: yaml, body: 'Front\n\n?\n\nBack' });
			const recoverSpy = vi.spyOn(parser['_yaml'], 'recover').mockResolvedValue(undefined);

			const result = await parser.parse('test.md');

			expect(recoverSpy).toHaveBeenCalledWith('test.md');
			expect(result.entity.uuid).toBe('recovered');
			expect(result.entity.front).toBe('Front');
		});

		it('should throw on second failure after recovery', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'any' }]);
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			vi.spyOn(parser['_yaml'], 'extractFmFromContent').mockImplementation(() => {
				throw new Error('fail');
			});
			vi.spyOn(parser['_yaml'], 'recover').mockResolvedValue(undefined);

			await expect(parser.parse('test.md')).rejects.toThrow('impossible to recover metadata');
		});
	});

	describe('parseAll', () => {
		it('should return empty array for non-existent directory', async () => {
			const result = await parser.parseAll('/missing');

			expect(result).toEqual([]);
		});

		it('should parse all markdown files in directory', async () => {
			plugin = createMockPlugin([
				{ path: '/flashcards/a.md', content: '---\n---\n' },
				{ path: '/flashcards/b.md', content: '---\n---\n' },
				{ path: '/flashcards/c.txt', content: 'not markdown' },
			]);
			plugin.app.vault.adapter.exists = vi.fn().mockImplementation(async (path: string) =>
				path === '/flashcards' || ['/flashcards/a.md', '/flashcards/b.md', '/flashcards/c.txt'].includes(path),
			);
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			const parseMetadataSpy = vi
				.spyOn(parser, 'parseMetadata')
				.mockImplementation(async (filepath) => ({
					entity: createFlashcardYaml({ uuid: filepath.endsWith('/a.md') ? 'a' : 'b' }),
					filepath,
				}));

			const result = await parser.parseAll('/flashcards');

			expect(parseMetadataSpy).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(2);
			const uuids = result.map((r) => r.entity.uuid);
			expect(uuids).toContain('a');
			expect(uuids).toContain('b');
		});

		it('should ignore non-markdown files', async () => {
			plugin = createMockPlugin([
				{ path: '/flashcards/note.md', content: '---\n---\n' },
				{ path: '/flashcards/image.png', content: 'binary' },
			]);
			plugin.app.vault.adapter.exists = vi.fn().mockImplementation(async (path: string) =>
				path === '/flashcards' || ['/flashcards/note.md', '/flashcards/image.png'].includes(path),
			);
			parser = new FlashcardParser(plugin as unknown as Plugin, settings);
			vi.spyOn(parser, 'parseMetadata').mockImplementation(async () => ({
				entity: createFlashcardYaml({ uuid: 'note' }),
				filepath: '/flashcards/note.md',
			}));

			const result = await parser.parseAll('/flashcards');

			expect(result).toHaveLength(1);
			expect(result[0].entity.uuid).toBe('note');
		});
	});
});
