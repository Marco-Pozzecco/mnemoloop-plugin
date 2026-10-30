import { CardStatus } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';

export interface SidebarGroup {
	status: CardStatus;
	label: string;
	cards: FlashcardMetadata[];
}

const GROUP_LABELS: Record<CardStatus, string> = {
	[CardStatus.STALE]: 'Stale',
	[CardStatus.ACTIVE]: 'Active',
	[CardStatus.PAUSED]: 'Paused',
	[CardStatus.DELETED]: 'Deleted',
};

/**
 * Attention-first order: STALE leads when it exists, so the card that needs
 * attention is never below the fold.
 */
export const SIDEBAR_GROUP_ORDER: CardStatus[] = [
	CardStatus.STALE,
	CardStatus.ACTIVE,
	CardStatus.PAUSED,
];

/**
 * Groups the active note's cards by status, dropping empty groups and ordering
 * each group's cards newest first.
 */
export function groupCardsByStatus(cards: FlashcardMetadata[]): SidebarGroup[] {
	const groups: SidebarGroup[] = [];
	for (const status of SIDEBAR_GROUP_ORDER) {
		const statusCards = cards
			.filter((card) => card.status === status)
			.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
		if (statusCards.length === 0) continue;
		groups.push({ status, label: GROUP_LABELS[status], cards: statusCards });
	}
	return groups;
}

/** The note's folder, shown under its name. Empty when the note sits at the vault root. */
export function noteFolder(path: string): string {
	const separator = path.lastIndexOf('/');
	return separator > 0 ? path.slice(0, separator) : '';
}

/** The group header's accessible name: it states the status and the card count. */
export function groupAriaLabel(label: string, count: number): string {
	return `${label}, ${count} ${count === 1 ? 'card' : 'cards'}`;
}
