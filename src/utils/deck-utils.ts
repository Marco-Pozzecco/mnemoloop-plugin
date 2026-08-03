export const DECK_SEPARATOR = '::';

export function splitDeckPath(path: string): string[] {
	return path.split(DECK_SEPARATOR);
}

export function getParentDecks(path: string): string[] {
	const parts = splitDeckPath(path);
	const parents: string[] = [];
	let current = '';
	for (let i = 0; i < parts.length - 1; i++) {
		current = current ? `${current}${DECK_SEPARATOR}${parts[i]}` : parts[i];
		parents.push(current);
	}
	return parents;
}

export function matchesDeckFilter(cardDecks: string[], filter: string): boolean {
	return cardDecks.some((deck) => deck === filter || deck.startsWith(`${filter}${DECK_SEPARATOR}`));
}

/**
 * Parse a comma-separated string of deck paths into an array.
 * Each path is trimmed; empty entries are filtered out.
 */
export function parseDeckList(input: string): string[] {
	return input
		.split(',')
		.map((deck) => deck.trim())
		.filter((deck) => deck.length > 0);
}

/**
 * Format an array of deck paths into a comma-separated string.
 * Returns an empty string for an empty array.
 */
export function formatDeckList(decks: string[]): string {
	return decks.join(', ');
}
