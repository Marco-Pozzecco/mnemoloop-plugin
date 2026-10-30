import { CardStatus } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

/** The active note the panel is bound to. `path` is the full vault path, `.md` included. */
export interface SidebarActiveNote {
	path: string;
	name: string;
}

export interface SidebarState {
	activeNote: SidebarActiveNote | null;
	/** The active note's linked cards, already filtered from the index. */
	cards: FlashcardMetadata[];
	/** Content previews keyed by filepath. */
	previews: Record<string, string>;
	isLoading: boolean;
}

const initialState: SidebarState = {
	activeNote: null,
	cards: [],
	previews: {},
	isLoading: true,
};

const store = writable<SidebarState>(initialState);

export class SidebarStore extends BaseStoreManager<SidebarState> {
	constructor() {
		super(initialState, store);
	}

	setActiveNote(activeNote: SidebarActiveNote | null): void {
		this.store.update((state) => ({ ...state, activeNote }));
	}

	setCards(cards: FlashcardMetadata[]): void {
		this.store.update((state) => ({ ...state, cards }));
	}

	setPreview(filepath: string, preview: string): void {
		this.store.update((state) => ({
			...state,
			previews: { ...state.previews, [filepath]: preview },
		}));
	}

	/** Clear all cached previews, or only those for the given filepaths. */
	clearPreviews(files?: string[]): void {
		this.store.update((state) => {
			if (Object.keys(state.previews).length === 0) return state;
			if (!files) return { ...state, previews: {} };
			const next = { ...state.previews };
			for (const file of files) {
				delete next[file];
			}
			return { ...state, previews: next };
		});
	}

	setLoading(isLoading: boolean): void {
		this.store.update((state) => ({ ...state, isLoading }));
	}

	reset(): void {
		this.store.set({ ...initialState });
	}
}

export const sidebarStore = new SidebarStore();

/**
 * Resolves a stored source wiki-link to the vault path it points at, or `null`
 * when it does not resolve. `fromPath` is the card file, so relative links
 * resolve from where the link is written.
 */
export type SourcePathResolver = (source: string, fromPath: string) => string | null;

/**
 * The panel's link rule: a card belongs to the active note when its stored
 * `source` resolves to that note. Resolution follows Obsidian, so a full path,
 * an extensionless path, a basename-only link, or an alias/heading/block variant
 * all count. Cards with no source, links that do not resolve to the note, and
 * soft-deleted cards are excluded.
 */
export function selectSidebarCards(
	cards: FlashcardMetadata[],
	notePath: string,
	resolveSourcePath: SourcePathResolver,
): FlashcardMetadata[] {
	return cards.filter(
		(card) =>
			card.status !== CardStatus.DELETED &&
			card.source !== null &&
			resolveSourcePath(card.source, card.file) === notePath,
	);
}
