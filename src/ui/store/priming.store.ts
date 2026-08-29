import type { TFile } from 'obsidian';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

export const DEFAULT_PRIMING_THRESHOLD = 7.0;

export type PrimingStatus = 'loading' | 'ready' | 'empty' | 'unavailable';

export interface PrimingSelection {
	deckFilter: string | undefined;
	deckLabel: string;
}

export interface PrimingCardRef {
	uuid: string;
	difficulty: number;
}

export interface PrimingNote {
	path: string;
	title: string;
	averageDifficulty: number;
	inboundLinkCount: number;
	file: TFile;
	cards: PrimingCardRef[];
}

export interface PrimingCluster {
	title: string | null;
	averageDifficulty: number;
	notes: PrimingNote[];
}

export interface PrimingCurrentContent {
	path: string;
	title: string;
	averageDifficulty: number;
	file: TFile;
	content: string;
}

export interface PrimingState {
	status: PrimingStatus;
	selection: PrimingSelection;
	threshold: number;
	clusters: PrimingCluster[];
	notes: PrimingNote[];
	currentIndex: number;
	currentContent: PrimingCurrentContent | null;
	error: string | null;
}

export function createInitialPrimingState(): PrimingState {
	return {
		status: 'loading',
		selection: { deckFilter: undefined, deckLabel: 'All decks' },
		threshold: DEFAULT_PRIMING_THRESHOLD,
		clusters: [],
		notes: [],
		currentIndex: 0,
		currentContent: null,
		error: null,
	};
}

const initial = createInitialPrimingState();

const store = writable(initial);

export function flattenPrimingClusters(clusters: PrimingCluster[]): PrimingNote[] {
	return clusters.flatMap((cluster) => cluster.notes);
}

export class PrimingStore extends BaseStoreManager<PrimingState> {
	constructor() {
		super(initial, store);
	}

	reset(): void {
		this.store.set(createInitialPrimingState());
	}
}

export const primingStore = new PrimingStore();
