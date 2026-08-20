import type { ComboboxOption } from './types';

/**
 * Case-insensitive substring filter on option labels.
 * An empty (or whitespace-only) search returns all options unchanged.
 */
export function filterOptions(options: ComboboxOption[], search: string): ComboboxOption[] {
	const query = search.trim().toLowerCase();
	if (query === '') return options;
	return options.filter((option) => option.label.toLowerCase().includes(query));
}

/**
 * True when the trimmed search is non-empty and does not exactly match
 * (case-insensitively) any existing option label.
 */
export function canCreateNew(options: ComboboxOption[], search: string): boolean {
	const query = search.trim();
	if (query === '') return false;
	return !options.some((option) => option.label.trim().toLowerCase() === query.toLowerCase());
}

/** Builds an `aria-describedby` id based on error/helper state (mirrors Select/Input). */
export function buildAriaDescribedBy(
	id: string,
	hasError: boolean,
	helperText?: string,
): string | undefined {
	if (hasError) return `${id}-error`;
	if (helperText) return `${id}-helper`;
	return undefined;
}
