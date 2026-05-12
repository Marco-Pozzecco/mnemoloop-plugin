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
	return cardDecks.some(
		(deck) => deck === filter || deck.startsWith(`${filter}${DECK_SEPARATOR}`),
	);
}
