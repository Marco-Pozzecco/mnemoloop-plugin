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

describe('Input', () => {
	describe('file structure', () => {
		it('should have Input.svelte file', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.svelte');
			expect(content).toContain('<script lang="ts">');
			expect(content).toContain('export let value');
			expect(content).toContain('export let label');
			expect(content).toContain('export let placeholder');
		});

		it('should have Input.types.ts file', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.types.ts');
			expect(content).toContain('export interface InputProps');
			expect(content).toContain('value');
			expect(content).toContain('label');
		});
	});

	describe('validation and error states', () => {
		it('should support error state', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.types.ts');
			expect(content).toContain('hasError');
			expect(content).toContain('errorMessage');
		});

		it('should support helper text', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.types.ts');
			expect(content).toContain('helperText');
		});

		it('should render error message in Svelte component', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.svelte');
			expect(content).toContain('ka-input-error');
			expect(content).toContain('hasError');
		});
	});

	describe('input types', () => {
		it('should support multiple input types', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.types.ts');
			expect(content).toContain("'text'");
			expect(content).toContain("'number'");
			expect(content).toContain("'email'");
			expect(content).toContain("'password'");
			expect(content).toContain("'search'");
		});

		it('should support number constraints', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.types.ts');
			expect(content).toContain('min');
			expect(content).toContain('max');
		});
	});

	describe('styling', () => {
		it('should use ka- prefix for classes', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.svelte');
			expect(content).toContain('ka-input');
			expect(content).toContain('ka-input-label');
		});

		it('should use Obsidian theme variables', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.svelte');
			expect(content).toContain('var(--background-modifier-border)');
			expect(content).toContain('var(--text-normal)');
		});

		it('should have focus state styling', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/Input.svelte');
			expect(content).toContain(':focus');
			expect(content).toContain('var(--interactive-accent)');
		});
	});

	describe('index exports', () => {
		it('should be exported from atoms index', () => {
			const content = readComponentFile('src/ui/components/design-system/atoms/index.ts');
			expect(content).toContain("export { default as Input }");
			expect(content).toContain("export type { InputProps }");
		});
	});
});
