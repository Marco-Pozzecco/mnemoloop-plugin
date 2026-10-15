import prettier from 'eslint-config-prettier';
import obsidian from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import requireClassPrefix from './eslint-rules/require-class-prefix.js';
import svelteConfig from './svelte.config.js';

const IGNORE_LIST = [
	'node_modules/',
	'dist/',
	'build/',
	'coverage/',
	'*.min.js',
	'**/*.js',
	'main.js',
	'**/*.json',
	'vite.config.ts',
	'vite.playground.config.ts',
	'vitest.config.ts',
	'vitest.dom.config.ts',
	'vitest.perf.config.ts',
	'tests/',
];

export default defineConfig(
	{
		ignores: IGNORE_LIST,
	},
	prettier,
	...svelte.configs.prettier,
	...svelte.configs.recommended,
	...obsidian.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: { '@typescript-eslint': ts.plugin },
		languageOptions: {
			parser: ts.parser,
			parserOptions: { projectService: true },
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			// '@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
				},
			],
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],

		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				projectService: true,
				extraFileExtensions: ['.svelte'],
				svelteConfig,
			},
		},

		plugins: {
			local: {
				rules: {
					'require-class-prefix': requireClassPrefix,
				},
			},
		},

		rules: {
			'obsidianmd/no-unsupported-api': 'error',
			// Enforce ml- prefix on CSS classes in Svelte templates.
			// Change 'warn' to 'error' once all violations are resolved.
			'local/require-class-prefix': [
				'warn',
				{
					prefix: 'ml-',
					// Add any intentional exceptions here, e.g.:
					// allow: ['has-error', 'disabled'],
				},
			],
		},
	},
	{
		// The playground is a development harness. It deliberately traffics in
		// `any` to impersonate the Obsidian runtime, injects already-escaped
		// markdown HTML, and mounts production views into its own DOM, so the
		// runtime-code rules for the plugin do not apply.
		files: ['playground/**'],
		rules: {
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'no-unsanitized/method': 'off',
			'no-unsanitized/property': 'off',
			'@microsoft/sdl/no-inner-html': 'off',
			'obsidianmd/no-static-styles-assignment': 'off',
			'obsidianmd/no-global-this': 'off',
			'obsidianmd/prefer-active-doc': 'off',
			'svelte/no-dom-manipulating': 'off',
		},
	},
);
