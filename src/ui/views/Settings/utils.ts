/**
 * Pure value mapping and parsing for the declarative settings tab. Kept free of
 * Obsidian DOM and store imports so the bridge rules are unit-testable.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const STEP_PATTERN = /^\d+[mhd]$/;

/** Vault-relative paths omit the leading slash; settings store them with one. */
export function stripLeadingSlash(value: string): string {
	return value.replace(/^\/+/, '');
}

function toText(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return '';
}

/** Normalize a folder-control value to the stored `/-prefixed` vault path. */
export function toVaultPath(value: unknown): string {
	const collapsed = toText(value)
		.trim()
		.replace(/\\/g, '/')
		.replace(/\/{2,}/g, '/');
	const stripped = collapsed.replace(/^\/+/, '').replace(/\/+$/, '');
	return stripped === '' ? '/' : `/${stripped}`;
}

/**
 * Normalize a source-note directory: empty stays empty (disables matching),
 * any non-empty value becomes a `/-prefixed` vault path.
 */
export function toSourceNoteDirectory(value: unknown): string {
	const trimmed = toText(value).trim();
	return trimmed === '' ? '' : toVaultPath(trimmed);
}

/** Read a stored value into the shape the control expects. */
export function readControlValue(key: string, value: unknown): unknown {
	switch (key) {
		case 'soft_delete_hours':
			return String(value);
		case 'flashcard.watch.directory':
		case 'source_note.watch.directory':
			return typeof value === 'string' ? stripLeadingSlash(value) : '';
		default:
			return value;
	}
}

/** Coerce a control value back into the stored `PluginSettings` shape. */
export function coerceControlValue(key: string, value: unknown): unknown {
	switch (key) {
		case 'soft_delete_hours':
			return typeof value === 'number' ? value : Number.parseInt(String(value), 10);
		case 'flashcard.watch.directory':
			return toVaultPath(value);
		case 'source_note.watch.directory':
			return toSourceNoteDirectory(value);
		default:
			return value;
	}
}

/** Parse a comma-separated learning/relearning step list. */
export function parseSteps(raw: string): ParseResult<string[]> {
	const steps = raw
		.split(',')
		.map((step) => step.trim())
		.filter(Boolean);

	if (steps.length === 0) {
		return { ok: false, error: 'Enter at least one step.' };
	}
	if (!steps.every((step) => STEP_PATTERN.test(step))) {
		return {
			ok: false,
			error: 'Each step must be a number followed by m, h, or d (e.g. 1m, 10m).',
		};
	}
	return { ok: true, value: steps };
}

/** Parse a comma-separated `#`-tag list; an empty list is allowed. */
export function parseTags(raw: string): ParseResult<string[]> {
	const tags = raw
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);

	if (!tags.every((tag) => tag.startsWith('#'))) {
		return { ok: false, error: "Tags must start with '#'." };
	}
	return { ok: true, value: tags };
}

export function formatSteps(steps: unknown): string {
	return Array.isArray(steps) ? steps.join(', ') : '';
}

export function formatTags(tags: unknown): string {
	return Array.isArray(tags) ? tags.join(', ') : '';
}
