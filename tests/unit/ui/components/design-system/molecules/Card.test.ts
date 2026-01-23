import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const pluginDir = process.cwd();

function readComponentFile(relativePath: string) {
	const fullPath = join(pluginDir, relativePath);
	if (!existsSync(fullPath)) {
		throw new Error(`File not found: ${fullPath}`);
	}
	return readFileSync(fullPath, 'utf-8');
}

describe('Card', () => {
	describe('file structure', () => {
		it('should have Card.svelte file', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.svelte');
			expect(content).toContain('<script lang="ts">');
			expect(content).toContain('export let title');
			expect(content).toContain('export let hasBorder');
		});

		it('should have Card.types.ts file', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.types.ts');
			expect(content).toContain('export interface CardProps');
			expect(content).toContain('title');
			expect(content).toContain('hasBorder');
		});
	});

	describe('slots', () => {
		it('should support content slot', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.svelte');
			expect(content).toContain('<div class="ka-card-content">');
			expect(content).toContain('<slot name="content">');
			expect(content).toContain('<slot />');
		});

		it('should support footer slot', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.svelte');
			expect(content).toContain('<footer class="ka-card-footer">');
			expect(content).toContain('<slot name="footer" />');
		});
	});

	describe('variants', () => {
		it('should support padding variants', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.types.ts');
			expect(content).toContain('padding');
			const svelteContent = readComponentFile('src/ui/components/design-system/molecules/Card.svelte');
			expect(svelteContent).toContain('padding-none');
			expect(svelteContent).toContain('padding-small');
			expect(svelteContent).toContain('padding-medium');
			expect(svelteContent).toContain('padding-large');
		});

		it('should support icon prop', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.types.ts');
			expect(content).toContain('icon');
		});
	});

	describe('styling', () => {
		it('should use ka- prefix for classes', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.svelte');
			expect(content).toContain('ka-card');
			expect(content).toContain('ka-card-header');
			expect(content).toContain('ka-card-content');
			expect(content).toContain('ka-card-footer');
		});

		it('should use Obsidian theme variables', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Card.svelte');
			expect(content).toContain('var(--background-secondary)');
			expect(content).toContain('var(--background-modifier-border)');
		});
	});

	describe('index exports', () => {
		it('should be exported from molecules index', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/index.ts');
			expect(content).toContain("export { default as Card }");
			expect(content).toContain("export type { CardProps }");
		});

		it('should be exported from design-system index', () => {
			const content = readComponentFile('src/ui/components/design-system/index.ts');
			expect(content).toContain("export * from './molecules'");
		});
	});
});
