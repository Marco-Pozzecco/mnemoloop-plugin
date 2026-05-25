import { describe, expect, it, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { FlashcardYamlEngine } from '@/modules/yaml-engines/FlashcardYamlEngine';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardYaml } from '../../../helpers/factories';
import { CardStatus } from '@/schemas';

describe('FlashcardYamlEngine', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let engine: FlashcardYamlEngine;

	beforeEach(() => {
		plugin = createMockPlugin([]);
		engine = new FlashcardYamlEngine(plugin as unknown as Plugin);
	});

	describe('recover', () => {
		it('should call processFrontMatter with default YAML', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: '' }]);
			engine = new FlashcardYamlEngine(plugin as unknown as Plugin);

			await engine.recover('test.md');

			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			const [fileArg] = plugin.app.fileManager.processFrontMatter.mock.calls[0];
			expect(fileArg.path).toBe('test.md');
		});

		it('should preserve body when recovering', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'existing body' }]);
			engine = new FlashcardYamlEngine(plugin as unknown as Plugin);

			await engine.recover('test.md');

			const file = plugin.app.vault.getAbstractFileByPath('test.md');
			const content = await plugin.app.vault.read(file);
			expect(content).toContain('existing body');
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
			expect(() => engine.extractFmFromContent('no frontmatter')).toThrow('Invalid YAML frontmatter');
		});

		it('should call processFrontMatter while preserving body', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: '---\nuuid: old\n---\nbody text' }]);
			engine = new FlashcardYamlEngine(plugin as unknown as Plugin);

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
