import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
import requireClassPrefix from './eslint-rules/require-class-prefix.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.min.js', 'main.js'],
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },

		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
				},
			],
		},
	},

	// type-checked rules for TypeScript source only
	{
		...ts.configs.recommendedTypeChecked[0],
		files: ['src/**/*.ts'],
		ignores: ['**/*.svelte*'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			...ts.configs.recommendedTypeChecked[2].rules,
		},
	},
	{
		files: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'tests/setup.ts', 'tests/helpers/*'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
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
			parserOptions: {
				// Note: projectService: true was removed because it causes duplicate
				// diagnostics in VS Code's ESLint extension for .svelte files.
				// ts.configs.recommended does not require type-aware linting.
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
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
