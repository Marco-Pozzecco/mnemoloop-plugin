import { CardStatus, CardType } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

export interface ManageFilters {
	/** '' = all card types */
	type: CardType | '';
	/** '' = all statuses */
	status: CardStatus | '';
	/** '' = all decks */
	deck: string;
}

export const EMPTY_MANAGE_FILTERS: ManageFilters = { type: '', status: '', deck: '' };

type ManageState = {
	flashcards: FlashcardMetadata[];
	/** Content previews keyed by filepath. */
	previews: Record<string, string>;
	filters: ManageFilters;
	currentPage: number;
	isLoading: boolean;
};

const initialState: ManageState = {
	flashcards: [],
	previews: {},
	filters: EMPTY_MANAGE_FILTERS,
	currentPage: 1,
	isLoading: true,
};

const store = writable<ManageState>(initialState);

export class ManageStore extends BaseStoreManager<ManageState> {
	constructor() {
		super(initialState, store);
	}

	setFlashcards(flashcards: FlashcardMetadata[]): void {
		this.store.update((state) => ({ ...state, flashcards }));
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

	setFilters(filters: ManageFilters): void {
		this.store.update((state) => ({ ...state, filters, currentPage: 1 }));
	}

	setCurrentPage(page: number): void {
		this.store.update((state) => ({ ...state, currentPage: page }));
	}

	setLoading(isLoading: boolean): void {
		this.store.update((state) => ({ ...state, isLoading }));
	}

	reset(): void {
		this.store.set({ ...initialState });
	}
}

export const manageStore = new ManageStore();
