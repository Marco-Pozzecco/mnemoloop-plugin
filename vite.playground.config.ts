import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig } from 'vite';

/**
 * Vite app build for the browser playground. Deliberately separate from
 * `vite.config.ts`: the production config builds a CommonJS library with
 * `obsidian` external, while the playground bundles a browser app with the
 * Obsidian module mocked and emits HTML into `playground-dist/`.
 */
export default defineConfig(({ mode }) => {
	const isProduction = mode === 'production';

	return {
		root: resolve(__dirname, 'playground'),
		base: './',
		define: {
			__DEV__: JSON.stringify(!isProduction),
			__LOG_LEVEL__: JSON.stringify(isProduction ? 'OFF' : 'DEBUG'),
		},
		resolve: {
			alias: {
				'@/*': resolve(__dirname, './src/*'),
				'@': resolve(__dirname, './src'),
				obsidian: resolve(__dirname, './playground/obsidian/index.ts'),
			},
		},
		build: {
			outDir: resolve(__dirname, 'playground-dist'),
			emptyOutDir: true,
			minify: isProduction,
		},
		plugins: [
			svelte({
				preprocess: sveltePreprocess({
					typescript: {
						tsconfigFile: 'tsconfig.svelte.json',
					},
					scss: {
						includePaths: [resolve(__dirname, 'src/ui/styles')],
					},
				}),
				compilerOptions: {
					dev: !isProduction,
				},
			}),
		],
	};
});
