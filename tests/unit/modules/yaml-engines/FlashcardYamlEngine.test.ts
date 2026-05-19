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
		it('should write default YAML with UUID to file', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: '' }]);
			engine = new FlashcardYamlEngine(plugin as unknown as Plugin);

			await engine.recover('test.md');

			const written = await plugin.app.vault.adapter.read('test.md');
			expect(written).toMatch(/^---\n/);
			expect(written).toContain('uuid:');
			expect(written).toContain('status: ACTIVE');
			expect(written).toContain('decks: []');
		});

		it('should preserve body when recovering', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: 'existing body' }]);
			engine = new FlashcardYamlEngine(plugin as unknown as Plugin);

			await engine.recover('test.md');

			const written = await plugin.app.vault.adapter.read('test.md');
			expect(written).toContain('existing body');
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

	describe('encode', () => {
		it('should produce valid frontmatter with all fields', () => {
			const yaml = createFlashcardYaml({ decks: ['Math', 'CS'] });

			const encoded = engine.encode(yaml);

			expect(encoded).toMatch(/^---\n/);
			expect(encoded).toMatch(/\n---$/);
			expect(encoded).toContain('status: ACTIVE');
			expect(encoded).toContain('decks: ["Math","CS"]');
		});

		it('should omit undefined values', () => {
			const yaml = createFlashcardYaml({ source: null });
			(yaml as Record<string, unknown>).extra = undefined;

			const encoded = engine.encode(yaml);

			expect(encoded).not.toContain('extra');
		});

		it('should include empty arrays', () => {
			const yaml = createFlashcardYaml({ decks: [] });

			const encoded = engine.encode(yaml);

			expect(encoded).toContain('decks: []');
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

		it('should write frontmatter while preserving body', async () => {
			plugin = createMockPlugin([{ path: 'test.md', content: '---\nuuid: old\n---\nbody text' }]);
			engine = new FlashcardYamlEngine(plugin as unknown as Plugin);

			await engine.write('test.md', createFlashcardYaml());

			const written = await plugin.app.vault.adapter.read('test.md');
			expect(written).toContain('body text');
		});

		it('should inherit removeFrontmatter behavior', () => {
			const content = '---\nuuid: test\n---\nbody text';

			const result = (engine as any).removeFrontmatter(content);

			expect(result).toBe('body text');
		});
	});
});
