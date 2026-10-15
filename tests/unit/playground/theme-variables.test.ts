import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guards the playground theme shim against drift: every Obsidian CSS variable
 * the plugin references without a fallback must be defined somewhere — the
 * shim, the plugin's own styles, or an inline style assignment.
 */

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SCANNED_DIRECTORIES = ['src', 'playground'];
const SCANNED_EXTENSIONS = new Set(['.scss', '.svelte', '.ts', '.css', '.html']);
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'playground-dist', 'coverage']);

function walk(directory: string, files: string[] = []): string[] {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		if (IGNORED_DIRECTORIES.has(entry.name)) continue;
		const full = path.join(directory, entry.name);
		if (entry.isDirectory()) walk(full, files);
		else if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
	}
	return files;
}

const REFERENCE_REGEX = /var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])/g;
const DEFINITION_REGEX = /(--[a-zA-Z0-9-]+)\s*:/g;
const SET_PROPERTY_REGEX = /setProperty\(\s*['"](--[a-zA-Z0-9-]+)['"]/g;

function matchAll(source: string, regex: RegExp): string[] {
	const matches: string[] = [];
	for (const match of source.matchAll(regex)) matches.push(match[1]);
	return matches;
}

describe('playground theme variables', () => {
	it('defines every referenced Obsidian variable without a fallback', () => {
		const files = SCANNED_DIRECTORIES.flatMap((directory) =>
			walk(path.join(pluginRoot, directory)),
		);
		const themePath = path.join(pluginRoot, 'playground', 'theme.css');
		const themeCss = fs.readFileSync(themePath, 'utf8');
		const baseBlock = /:root\s*,\s*\.theme-light\s*{([\s\S]*?)\n}/.exec(themeCss);
		expect(baseBlock, 'theme.css base (:root/.theme-light) block').not.toBeNull();

		const defined = new Set<string>();
		const missing = new Set<string>();
		// Only the base block counts as a shim definition: dark overrides inherit
		// from it, so a variable that exists only under `.theme-dark` leaves the
		// light theme unstyled and must fail.
		for (const name of matchAll(baseBlock![1], DEFINITION_REGEX)) defined.add(name);

		const sources = files
			.filter((file) => file !== themePath)
			.map((file) => fs.readFileSync(file, 'utf8'));

		for (const source of sources) {
			for (const name of matchAll(source, DEFINITION_REGEX)) defined.add(name);
			for (const name of matchAll(source, SET_PROPERTY_REGEX)) defined.add(name);
		}

		for (const source of sources) {
			REFERENCE_REGEX.lastIndex = 0;
			for (const match of source.matchAll(REFERENCE_REGEX)) {
				const name = match[1];
				const hasFallback = match[2] === ',';
				if (hasFallback || name.startsWith('--bits-')) continue;
				if (!defined.has(name)) missing.add(name);
			}
		}

		expect([...missing].sort()).toEqual([]);
	});
});
