/**
 * Read and write nested object values addressed by a dot-separated path
 * (for example `flashcard.fsrs.request_retention`). Used by the settings
 * bridge to map flat Obsidian control keys onto the nested `PluginSettings`
 * shape.
 */

export function getPath(source: unknown, dotPath: string): unknown {
	return dotPath.split('.').reduce<unknown>((current, key) => {
		if (current === null || typeof current !== 'object') {
			return undefined;
		}
		return (current as Record<string, unknown>)[key];
	}, source);
}

export function setPath(
	target: Record<string, unknown>,
	dotPath: string,
	value: unknown,
): void {
	const keys = dotPath.split('.');
	let current = target;

	for (let index = 0; index < keys.length - 1; index++) {
		const key = keys[index];
		if (!key) continue;
		const next = current[key];
		if (next === null || typeof next !== 'object' || Array.isArray(next)) {
			current[key] = {};
		}
		current = current[key] as Record<string, unknown>;
	}

	const lastKey = keys[keys.length - 1];
	if (lastKey) {
		current[lastKey] = value;
	}
}
