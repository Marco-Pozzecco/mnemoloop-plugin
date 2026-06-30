import type { FlashcardMetadata } from '@/schemas';
import type { Stats } from '@/schemas/statistics';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

type AnalyticsState = {
	flashcards: FlashcardMetadata[];
	stats: Stats | null;
	selectedDeck: string | null;
};

const initialState: AnalyticsState = {
	flashcards: [],
	stats: null,
	selectedDeck: null,
};

const store = writable<AnalyticsState>(initialState);

export class AnalyticsStore extends BaseStoreManager<AnalyticsState> {
	constructor() {
		super(initialState, store);
	}

	setStats(stats: Stats | null) {
		this.store.update((state) => ({ ...state, stats }));
	}

	setFlashcards(flashcards: FlashcardMetadata[]) {
		this.store.update((state) => ({ ...state, flashcards }));
	}
}

export const analyticsStore = new AnalyticsStore();
