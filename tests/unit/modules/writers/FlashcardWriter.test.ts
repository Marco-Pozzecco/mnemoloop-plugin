import { Logger } from '@/utils/Logger';
import { IEntityParser } from '@/interfaces/parser/IEntityParser';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import {
	CardType,
	Flashcard,
	FlashcardBaseContent,
	FlashcardContent,
	FlashcardYaml,
} from '@/schemas';
import { Plugin } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFlashcardYaml } from '../../../helpers/factories';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

describe('FlashcardWriter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let entityParser: IEntityParser<Flashcard, FlashcardYaml, FlashcardContent>;
	let writer: FlashcardWriter;

	beforeEach(() => {
		plugin = createMockPlugin([
			{ path: 'existing.md', content: '---\nuuid: old\n---\nFront\n\n?\n\nBack' },
		]);
		entityParser = {
			serializeContent: vi.fn().mockImplementation((content: FlashcardContent) => {
				const c = content as { meta_type: CardType.Basic; front: string; back: string };
				return { entity: `${c.front}\n\n?\n\n${c.back}`, success: true };
			}),
			serializeEntity: vi.fn().mockImplementation((entity: Flashcard) => ({
				entity: `---\nuuid: ${entity.uuid}\n---\n${(entity.content as FlashcardBaseContent).front}\n\n?\n\n${(entity.content as FlashcardBaseContent).back}`,
				success: true as const,
			})),
			parseFile: vi.fn().mockResolvedValue({
				entity: {
					...createFlashcardYaml(),
					card_type: CardType.Basic,
					content: { meta_type: CardType.Basic, front: 'Front', back: 'Back' },
				},
				stats: { created_at: '', updated_at: '' },
				filepath: 'existing.md',
				success: true,
			}),
			parseContent: vi.fn().mockReturnValue({
				entity: { meta_type: CardType.Basic, front: 'Parsed Front', back: 'Parsed Back' },
				success: true,
			}),
		} as unknown as IEntityParser<Flashcard, FlashcardYaml, FlashcardContent>;
		writer = new FlashcardWriter(plugin as unknown as Plugin, entityParser);
		vi.spyOn(Logger, 'error').mockImplementation(() => {});
	});

	describe('create', () => {
		it('should write new file with frontmatter and serialized body', async () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				card_type: CardType.Basic as const,
				content: {
					meta_type: CardType.Basic,
					front: 'New Front',
					back: 'New Back',
				},
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
				card_type: CardType.Basic as const,
				content: {
					meta_type: CardType.Basic,
					front: 'Front',
					back: 'Back',
				},
			};

			await expect(writer.create('existing.md', entity)).rejects.toThrow('File already exists');
		});
	});

	describe('update', () => {
		it('should overwrite existing file', async () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				card_type: CardType.Basic as const,
				content: {
					meta_type: CardType.Basic,
					front: 'Updated Front',
					back: 'Updated Back',
				},
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
				card_type: CardType.Basic as const,
				content: {
					meta_type: CardType.Basic,
					front: 'Front',
					back: 'Back',
				},
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

			await writer.updateBody('existing.md', {
				meta_type: CardType.Basic,
				front: 'New Front',
				back: 'New Back',
			});

			const content = await plugin.app.vault.adapter.read('existing.md');
			expect(content).toContain('New Front');
			expect(content).toContain('New Back');
			expect(content).toContain('uuid: 00000000-0000-0000-0000-000000000000');
		});

		it('should throw if file does not exist', async () => {
			await expect(
				writer.updateBody('missing.md', { meta_type: CardType.Basic, front: 'New', back: 'Body' }),
			).rejects.toThrow('File not found');
		});
	});

	describe('delete', () => {
		it('should delete existing file', async () => {
			await writer.delete('existing.md');

			expect(plugin.app.fileManager.trashFile).toHaveBeenCalled();
		});

		it('should throw if file not found', async () => {
			await expect(writer.delete('missing.md')).rejects.toThrow('File not found');
		});
	});

	describe('extractMetadata', () => {
		it('should extract and validate YAML fields from entity', () => {
			const entity: Flashcard = {
				...createFlashcardYaml(),
				card_type: CardType.Basic as const,
				content: {
					meta_type: CardType.Basic,
					front: 'Front',
					back: 'Back',
				},
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
				card_type: CardType.Basic as const,
				content: {
					meta_type: CardType.Basic,
					front: 'Front',
					back: 'Back',
				},
			};

			const result = (writer as unknown as Record<string, (e: Flashcard) => unknown>).extractBody(
				entity,
			);

			expect(result).toEqual({ meta_type: CardType.Basic, front: 'Front', back: 'Back' });
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
