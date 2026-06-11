import { IParser } from '@/interfaces/IParser';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import { Flashcard, FlashcardYaml } from '@/schemas';
import { Plugin } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFlashcardYaml } from '../../../helpers/factories';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

describe('FlashcardWriter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let parser: IParser<Flashcard, FlashcardYaml>;
	let writer: FlashcardWriter;

	beforeEach(() => {
		plugin = createMockPlugin([
			{ path: 'existing.md', content: '---\nuuid: old\n---\nFront\n\n?\n\nBack' },
		]);
		parser = {
			marker: '?',
			parseContent: vi.fn().mockReturnValue({
				entity: { front: 'Parsed Front', back: 'Parsed Back', uuid: 'parsed' },
				success: true,
			}),
			parse: vi.fn(),
			parseMetadata: vi.fn(),
			parseAll: vi.fn(),
		} as unknown as IParser<Flashcard, FlashcardYaml>;
		writer = new FlashcardWriter(plugin as unknown as Plugin, parser);
	});

	describe('create', () => {
		it('should write new file with frontmatter and serialized body', async () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				front: 'New Front',
				back: 'New Back',
			};

			await writer.create('new.md', entity);

			const content = await plugin.app.vault.adapter.read('new.md');
			expect(content).toContain('uuid: 00000000-0000-0000-0000-000000000000');
			expect(content).toContain('New Front');
			expect(content).toContain('New Back');
			expect(content).toContain('?');
		});

		it('should throw if file already exists', async () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				front: 'Front',
				back: 'Back',
			};

			await expect(writer.create('existing.md', entity)).rejects.toThrow('File already exists');
		});
	});

	describe('update', () => {
		it('should overwrite existing file', async () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				front: 'Updated Front',
				back: 'Updated Back',
			};

			await writer.update('existing.md', entity);

			const content = await plugin.app.vault.adapter.read('existing.md');
			expect(content).toContain('uuid: 00000000-0000-0000-0000-000000000000');
			expect(content).toContain('Updated Front');
			expect(content).toContain('Updated Back');
		});

		it('should throw if file does not exist', async () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				front: 'Front',
				back: 'Back',
			};

			await expect(writer.update('missing.md', entity)).rejects.toThrow('File not found');
		});
	});

	describe('updateFrontmatter', () => {
		it('should update frontmatter while preserving body', async () => {
			await writer.updateFrontmatter('existing.md', {
				uuid: '00000000-0000-0000-0000-000000000000',
			});

			const content = await plugin.app.vault.adapter.read('existing.md');
			expect(content).toContain('uuid: 00000000-0000-0000-0000-000000000000');
			expect(content).toContain('Front');
			expect(content).toContain('Back');
		});

		it('should throw if file does not exist', async () => {
			await expect(
				writer.updateFrontmatter('missing.md', { uuid: '00000000-0000-0000-0000-000000000000' }),
			).rejects.toThrow('File not found');
		});
	});

	describe('updateBody', () => {
		it('should update body while preserving frontmatter', async () => {
			vi.spyOn(plugin.app.metadataCache, 'getFileCache').mockReturnValue({
				frontmatter: createFlashcardYaml(),
				frontmatterPosition: null,
				headings: [],
				links: [],
				embeds: [],
				tags: [],
				blocks: {},
				sections: [],
			});

			await writer.updateBody('existing.md', { front: 'New Front', back: 'New Back' });

			const content = await plugin.app.vault.adapter.read('existing.md');
			expect(content).toContain('New Front');
			expect(content).toContain('New Back');
			expect(content).toContain('uuid: 00000000-0000-0000-0000-000000000000');
		});

		it('should throw if file does not exist', async () => {
			await expect(writer.updateBody('missing.md', { front: 'New', back: 'Body' })).rejects.toThrow(
				'File not found',
			);
		});
	});

	describe('delete', () => {
		it('should delete existing file', async () => {
			await writer.delete('existing.md');

			expect(plugin.app.vault.delete).toHaveBeenCalled();
		});

		it('should throw if file not found', async () => {
			await expect(writer.delete('missing.md')).rejects.toThrow('File not found');
		});
	});

	describe('serializeBody', () => {
		it('should format body with marker separator', () => {
			const result = (writer as unknown as Record<string, (b: unknown) => string>).serializeBody({
				front: 'Front',
				back: 'Back',
			});

			expect(result).toBe('Front\n\n?\n\nBack');
		});
	});

	describe('deserializeBody', () => {
		it('should delegate to parser.parseContent', () => {
			const result = (writer as unknown as Record<string, (c: string) => unknown>).deserializeBody(
				'some content',
			);

			expect(parser.parseContent).toHaveBeenCalledWith('some content');
			expect(result).toEqual({ front: 'Parsed Front', back: 'Parsed Back' });
		});
	});

	describe('extractMetadata', () => {
		it('should extract and validate YAML fields from entity', () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				front: 'Front',
				back: 'Back',
			};

			const result = (
				writer as unknown as Record<string, (e: Flashcard) => unknown>
			).extractMetadata(entity);

			expect(result).toEqual(
				expect.objectContaining({ uuid: '00000000-0000-0000-0000-000000000000' }),
			);
		});

		it('should throw on invalid metadata', () => {
			expect(() =>
				(writer as unknown as Record<string, (e: unknown) => unknown>).extractMetadata({
					invalid: true,
				}),
			).toThrow();
		});
	});

	describe('extractBody', () => {
		it('should extract body fields from entity', () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				front: 'Front',
				back: 'Back',
			};

			const result = (writer as unknown as Record<string, (e: Flashcard) => unknown>).extractBody(
				entity,
			);

			expect(result).toEqual({ front: 'Front', back: 'Back' });
		});

		it('should throw on missing body fields', () => {
			expect(() =>
				(writer as unknown as Record<string, (e: unknown) => unknown>).extractBody({
					uuid: 'test',
				}),
			).toThrow();
		});
	});
});
