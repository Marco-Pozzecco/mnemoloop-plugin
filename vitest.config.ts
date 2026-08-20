import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig, type UserConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: ['tests/**/*.{test,spec}.ts', '!tests/**/*.interaction.test.ts'],
		setupFiles: ['tests/setup.ts'],
	},
	resolve: {
		conditions: ['svelte'],
		alias: {
			'@': path.resolve(__dirname, './src'),
			obsidian: path.resolve(__dirname, './tests/helpers/obsidian-stub.ts'),
		},
	},
	ssr: {
		resolve: {
			conditions: ['svelte'],
		},
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({
				typescript: {
					tsconfigFile: 'tsconfig.svelte.json',
				},
				scss: {
					includePaths: [path.resolve(__dirname, 'src/ui/styles')],
				},
			}),
		}),
	] as unknown as UserConfig['plugins'],
});
