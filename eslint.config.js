import prettier from 'eslint-config-prettier';
import obsidian from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteParser from 'svelte-eslint-parser';
import requireClassPrefix from './eslint-rules/require-class-prefix.js';
import svelteConfig from './svelte.config.js';

export default defineConfig(
	{
		ignores: [
			'node_modules/',
			'dist/',
			'build/',
			'coverage/',
			'*.min.js',
			'main.js',
			'**/*.json',
			'vitest.config.ts',
			'vitest.dom.config.ts',
		],
	},
	prettier,
	...svelte.configs.prettier,
	...svelte.configs.recommended,
	...obsidian.configs.recommended.map((config) => ({
		...config,
		ignores: ['vite.config.ts', '**/*.js'],
	})),
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
		files: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'tests/setup.ts', 'tests/helpers/*'],
		plugins: { '@typescript-eslint': ts.plugin },
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unnecessary-type-assertion': 'off',
			'@typescript-eslint/await-thenable': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-base-to-string': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'obsidianmd/no-global-this': 'off',
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
);
