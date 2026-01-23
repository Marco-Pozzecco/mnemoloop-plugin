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

describe('Modal', () => {
	describe('file structure', () => {
		it('should have Modal.svelte file', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('<script lang="ts">');
			expect(content).toContain('export let open');
			expect(content).toContain('export let title');
			expect(content).toContain('export let maxWidth');
		});

		it('should have Modal.types.ts file', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.types.ts');
			expect(content).toContain('export interface ModalProps');
			expect(content).toContain('open');
			expect(content).toContain('title');
		});
	});

	describe('slots', () => {
		it('should support body slot', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('<div class="ka-modal-body">');
			expect(content).toContain('<slot name="body">');
		});

		it('should support footer slot', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('<footer class="ka-modal-footer">');
			expect(content).toContain('<slot name="footer" />');
		});
	});

	describe('max width variants', () => {
		it('should support all max width variants', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.types.ts');
			expect(content).toContain('maxWidth');
			const svelteContent = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(svelteContent).toContain('max-width-small');
			expect(svelteContent).toContain('max-width-medium');
			expect(svelteContent).toContain('max-width-large');
			expect(svelteContent).toContain('max-width-full');
		});
	});

	describe('close functionality', () => {
		it('should support close on backdrop', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.types.ts');
			expect(content).toContain('closeOnBackdrop');
		});

		it('should support close on escape', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.types.ts');
			expect(content).toContain('closeOnEscape');
		});

		it('should have close button support', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.types.ts');
			expect(content).toContain('showCloseButton');
			const svelteContent = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(svelteContent).toContain('ka-modal-close');
		});
	});

	describe('accessibility', () => {
		it('should have dialog role', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('role="dialog"');
		});

		it('should have aria-modal', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('aria-modal="true"');
		});

		it('should have aria-labelledby', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('aria-labelledby');
		});
	});

	describe('styling', () => {
		it('should use ka- prefix for classes', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('ka-modal-backdrop');
			expect(content).toContain('ka-modal');
			expect(content).toContain('ka-modal-header');
			expect(content).toContain('ka-modal-body');
		});

		it('should use Obsidian theme variables', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/Modal.svelte');
			expect(content).toContain('var(--background-primary)');
			expect(content).toContain('var(--background-modifier-border)');
		});
	});

	describe('index exports', () => {
		it('should be exported from molecules index', () => {
			const content = readComponentFile('src/ui/components/design-system/molecules/index.ts');
			expect(content).toContain("export { default as Modal }");
			expect(content).toContain("export type { ModalProps }");
		});

		it('should be exported from design-system index', () => {
			const content = readComponentFile('src/ui/components/design-system/index.ts');
			expect(content).toContain("export * from './molecules'");
		});
	});
});
