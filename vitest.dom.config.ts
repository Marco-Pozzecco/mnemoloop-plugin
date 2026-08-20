import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig, type UserConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DOM (jsdom) test config for client-side interaction tests. Aliases the exact
// `svelte` main entry to the CLIENT build (the base config resolves `svelte` to
// the server build, which throws server_context_required on `mount()`).
export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['tests/**/*.interaction.test.ts'],
		setupFiles: ['tests/setup.ts'],
	},
	resolve: {
		conditions: ['svelte'],
		alias: [
			{ find: /^svelte$/, replacement: path.resolve(__dirname, './node_modules/svelte/src/index-client.js') },
			{ find: '@', replacement: path.resolve(__dirname, './src') },
			{ find: 'obsidian', replacement: path.resolve(__dirname, './tests/helpers/obsidian-stub.ts') },
		],
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
