import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Plugin, parseYaml } from 'obsidian';
import { FlashcardYamlParser } from '@/modules/parsers/yaml/FlashcardYamlParser';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardYaml } from '../../../helpers/factories';
import { CardStatus } from '@/schemas';

describe('FlashcardYamlEngine', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let engine: FlashcardYamlParser;

	beforeEach(() => {
		plugin = createMockPlugin([]);
		engine = new FlashcardYamlParser(plugin as unknown as Plugin);
	});

	describe('recover', () => {
		it('should call processFrontMatter with default YAML', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: '' }]);
			engine = new FlashcardYamlParser(plugin as unknown as Plugin);

			await engine.recover('test.md');

			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			const [fileArg] = plugin.app.fileManager.processFrontMatter.mock.calls[0];
			expect(fileArg.path).toBe('test.md');
		});

		it('should preserve body when recovering', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'existing body' }]);
			engine = new FlashcardYamlParser(plugin as unknown as Plugin);

			await engine.recover('test.md');

			const file = plugin.app.vault.getAbstractFileByPath('test.md');
			const content = await plugin.app.vault.read(file);
			expect(content).toContain('existing body');
		});

		it('should preserve valid UUID during recovery', async () => {
			const realUuid = '550e8400-e29b-41d4-a716-446655440000';
			// Override the global parseYaml mock (which returns {}) to return actual parsed YAML
			vi.mocked(parseYaml).mockReturnValue({ uuid: realUuid, status: 'ACTIVE' });

			plugin = createMockPlugin([
				{ path: 'test.md', content: `---\nuuid: ${realUuid}\nstatus: ACTIVE\n---\nbody` },
			]);
			engine = new FlashcardYamlParser(plugin as unknown as Plugin);

			const result = await engine.recover('test.md');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.uuid).toBe(realUuid);
			}
		});

		it('should default only broken fields, preserve valid ones', async () => {
			const realUuid = '550e8400-e29b-41d4-a716-446655440000';
			// Override parseYaml to return the raw frontmatter as if parsed from the file
			vi.mocked(parseYaml).mockReturnValue({
				uuid: realUuid,
				status: 'ACTIVE',
				card_type: 'bogus',
				stability: -5,
			});

			plugin = createMockPlugin([
				{
					path: 'test.md',
					content: `---\nuuid: ${realUuid}\nstatus: ACTIVE\ncard_type: bogus\nstability: -5\n---\nbody`,
				},
			]);
			engine = new FlashcardYamlParser(plugin as unknown as Plugin);

			const result = await engine.recover('test.md');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.uuid).toBe(realUuid); // preserved
				expect(result.data.status).toBe(CardStatus.ACTIVE); // preserved
				expect(result.data.card_type).toBe('basic'); // fixed
				expect(result.data.stability).toBe(0); // fixed
				expect(result.warnings).toBeDefined();
				expect(result.warnings!.length).toBeGreaterThanOrEqual(2);
			}
		});
	});

	describe('validate', () => {
		it('should validate complete flashcard YAML', () => {
			const yaml = createFlashcardYaml();

			const result = engine.validate(yaml);

			expect(result.status).toBe(CardStatus.ACTIVE);
			expect(result.decks).toEqual([]);
		});

		it('should throw on missing required fields', () => {
			expect(() => engine.validate({} as never)).toThrow();
		});

		it('should throw on invalid uuid', () => {
			const yaml = createFlashcardYaml({ uuid: 'not-a-uuid' as never });
			expect(() => engine.validate(yaml)).toThrow();
		});
	});

	describe('decode', () => {
		it('should throw when parseYaml returns empty object against strict schema', () => {
			expect(() => engine.decode('---\n---\n')).toThrow();
		});
	});

	describe('integration with BaseYamlEngine', () => {
		it('should throw when parseYaml returns empty object against strict schema', () => {
			expect(() => engine.extractFmFromContent('---\nuuid: abc\n---\nbody')).toThrow();
		});

		it('should throw when no frontmatter in content', () => {
			expect(() => engine.extractFmFromContent('no frontmatter')).toThrow(
				'Invalid YAML frontmatter',
			);
		});

		it('should call processFrontMatter while preserving body', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: '---\nuuid: old\n---\nbody text' }]);
			engine = new FlashcardYamlParser(plugin as unknown as Plugin);

			await engine.write('test.md', createFlashcardYaml());

			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			const file = plugin.app.vault.getAbstractFileByPath('test.md');
			const content = await plugin.app.vault.read(file);
			expect(content).toContain('body text');
		});

		it('should inherit removeFrontmatter behavior', () => {
			const content = '---\nuuid: test\n---\nbody text';

			const result = (engine as any).removeFrontmatter(content);

			expect(result).toBe('body text');
		});
	});
});
