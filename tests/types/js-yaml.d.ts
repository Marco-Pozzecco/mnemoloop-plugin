/**
 * Obsidian implements `parseYaml`/`stringifyYaml` with js-yaml, so integration
 * tests that need the real YAML codec stand in js-yaml for the mocked module.
 * js-yaml ships as a transitive dependency of the tooling and carries no
 * types of its own.
 */
declare module 'js-yaml' {
	export function load(input: string): unknown;
	export function dump(input: unknown): string;
}
