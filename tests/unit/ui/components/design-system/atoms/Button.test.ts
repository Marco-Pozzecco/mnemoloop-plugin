import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// The tests are run from the plugin directory
const pluginDir = process.cwd();

function readComponentFile(relativePath: string) {
	const fullPath = join(pluginDir, relativePath);
	if (!existsSync(fullPath)) {
		throw new Error(`File not found: ${fullPath}`);
	}
	return readFileSync(fullPath, 'utf-8');
}

describe('Button', () => {
	describe('file structure', () => {
		it('should have Button.svelte file', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.svelte');
			expect(content).toContain('<script lang="ts">');
			expect(content).toContain('export let variant');
			expect(content).toContain('export let size');
			expect(content).toContain('export let disabled');
		});

		it('should have Button.types.ts file', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.types.ts');
			expect(content).toContain('export interface ButtonProps');
			expect(content).toContain('variant');
			expect(content).toContain('size');
			expect(content).toContain('disabled');
		});
	});

	describe('component features', () => {
		it('should support all variants', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.types.ts');
			expect(content).toContain("'primary'");
			expect(content).toContain("'secondary'");
			expect(content).toContain("'danger'");
		});

		it('should support all sizes', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.types.ts');
			expect(content).toContain("'small'");
			expect(content).toContain("'medium'");
			expect(content).toContain("'large'");
		});

		it('should use ka- prefix for classes', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.svelte');
			expect(content).toContain('ka-button');
		});

		it('should use Obsidian theme variables', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.svelte');
			expect(content).toContain('var(--interactive-accent)');
			expect(content).toContain('var(--text-normal)');
		});
	});

	describe('accessibility', () => {
		it('should have aria-label support', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.svelte');
			expect(content).toContain('aria-label');
		});

		it('should have disabled state', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Button.svelte');
			expect(content).toContain(':disabled');
		});
	});

	describe('index exports', () => {
		it('should be exported from atoms index', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/index.ts');
			expect(content).toContain("export { default as Button }");
			expect(content).toContain("export type { ButtonProps }");
		});

		it('should be exported from design-system index', () => {
			const content = readComponentFile('src/ui/components/design-system/index.ts');
			expect(content).toContain("export * from './atoms'");
		});
	});
});
