import { getLinkpath } from 'obsidian';
import type { App, TFile } from 'obsidian';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '@/modules/events';
import { CardStatus, FlashcardMetadata } from '@/schemas';
import { IndexKey } from '@/types/indexes';
import {
	DECK_SEPARATOR,
	getParentDecks,
	matchesDeckFilter,
	splitDeckPath,
} from '@/utils/deck-utils';
import { settingsStore } from '@/ui/store/settings.store';
import { uiStore } from '@/ui/store/ui.store';
import { DashboardController } from './DashboardController';
import {
	DEFAULT_PRIMING_THRESHOLD,
	PrimingCluster,
	PrimingNote,
	PrimingSelection,
	flattenPrimingClusters,
	primingStore,
} from '../store/priming.store';

export class PrimingRequestCancelledError extends Error {
	constructor() {
		super('Priming request cancelled');
		this.name = 'PrimingRequestCancelledError';
	}
}

/**
 * Module-level generation counter shared by every PrimingController
 * instance so a stale completion can never overwrite a newer request,
 * retry, navigation, or dashboard exit.
 */
let globalGeneration = 0;

export function matchesPrimingDeck(cardDecks: string[], filter: string | undefined): boolean {
	if (filter === undefined) {
		return true;
	}
	if (filter === 'Uncategorized') {
		return cardDecks.length === 0;
	}
	return matchesDeckFilter(cardDecks, filter);
}

export function sourceLinkToPath(source: string): string {
	return getLinkpath(source.slice(2, -2));
}

export function filterPrimingCandidates(
	cards: FlashcardMetadata[],
	selection: PrimingSelection,
	threshold: number,
	now: Date,
): FlashcardMetadata[] {
	return cards.filter((card) => {
		if (card.status !== CardStatus.ACTIVE) {
			return false;
		}
		if (new Date(card.due) > now) {
			return false;
		}
		if (card.source === null) {
			return false;
		}
		if (!(card.difficulty > threshold)) {
			return false;
		}
		return matchesPrimingDeck(card.decks, selection.deckFilter);
	});
}

export interface PrimingCandidateNote {
	path: string;
	file: TFile;
	averageDifficulty: number;
	eligibleDecks: string[];
	cards: FlashcardMetadata[];
}

/**
 * Resolve candidate cards to Markdown source notes and group the
 * qualifying cards per resolved note path. Unresolved, deleted, and
 * non-Markdown targets are skipped without failing the session.
 */
export function discoverPrimingCandidates(
	cards: FlashcardMetadata[],
	app: App,
): PrimingCandidateNote[] {
	const grouped = new Map<string, PrimingCandidateNote>();

	for (const card of cards) {
		if (card.source === null) {
			continue;
		}
		const linkpath = sourceLinkToPath(card.source);
		const dest = app.metadataCache.getFirstLinkpathDest(linkpath, card.file);
		if (!dest) {
			continue;
		}
		if (dest.extension !== 'md') {
			continue;
		}

		const existing = grouped.get(dest.path);
		if (existing) {
			existing.cards.push(card);
			for (const deck of card.decks) {
				if (!existing.eligibleDecks.includes(deck)) {
					existing.eligibleDecks.push(deck);
				}
			}
			continue;
		}

		grouped.set(dest.path, {
			path: dest.path,
			file: dest,
			averageDifficulty: 0,
			eligibleDecks: [...card.decks],
			cards: [card],
		});
	}

	for (const note of grouped.values()) {
		note.averageDifficulty =
			note.cards.reduce((sum, card) => sum + card.difficulty, 0) / note.cards.length;
	}

	return Array.from(grouped.values());
}

function deriveClusterTitle(
	notes: PrimingCandidateNote[],
	selection: PrimingSelection,
): string | null {
	let common: Set<string> | null = null;

	for (const note of notes) {
		const ancestry = new Set<string>();
		for (const deck of note.eligibleDecks) {
			for (const ancestor of [...getParentDecks(deck), deck]) {
				ancestry.add(ancestor);
			}
		}
		if (common === null) {
			common = ancestry;
		} else {
			const currentCommon: Set<string> = common;
			common = new Set([...currentCommon].filter((path) => ancestry.has(path)));
		}
	}

	if (common === null) {
		return null;
	}

	let candidates = [...common];
	if (selection.deckFilter && selection.deckFilter !== 'Uncategorized') {
		candidates = candidates.filter((path) =>
			path.startsWith(`${selection.deckFilter}${DECK_SEPARATOR}`),
		);
	}

	candidates.sort((a, b) => splitDeckPath(b).length - splitDeckPath(a).length);
	const deepest = candidates[0];
	if (!deepest) {
		return null;
	}

	if (selection.deckFilter && selection.deckFilter !== 'Uncategorized') {
		return deepest.slice(selection.deckFilter.length + DECK_SEPARATOR.length);
	}
	return deepest;
}

function buildComponents(
	notes: PrimingCandidateNote[],
	resolvedLinks: Record<string, Record<string, number>>,
): PrimingCandidateNote[][] {
	const parent = new Map<string, string>();
	const find = (path: string): string => {
		let root = path;
		while (parent.get(root) !== root) {
			const next = parent.get(root);
			if (next === undefined) {
				break;
			}
			root = next;
		}
		parent.set(path, root);
		return root;
	};

	for (const note of notes) {
		parent.set(note.path, note.path);
	}

	for (let i = 0; i < notes.length; i++) {
		for (let j = i + 1; j < notes.length; j++) {
			const a = notes[i];
			const b = notes[j];
			const aLinksB = (resolvedLinks[a.path]?.[b.path] ?? 0) > 0;
			const bLinksA = (resolvedLinks[b.path]?.[a.path] ?? 0) > 0;
			if (aLinksB || bLinksA) {
				const rootA = find(a.path);
				const rootB = find(b.path);
				if (rootA !== rootB) {
					parent.set(rootB, rootA);
				}
			}
		}
	}

	const components = new Map<string, PrimingCandidateNote[]>();
	for (const note of notes) {
		const root = find(note.path);
		const existing = components.get(root);
		if (existing) {
			existing.push(note);
		} else {
			components.set(root, [note]);
		}
	}
	return Array.from(components.values());
}

/**
 * Build weakly connected backlink clusters with deterministic note and
 * cluster ordering plus optional deepest shared-subdeck titles.
 */
export function buildPrimingClusters(
	cards: FlashcardMetadata[],
	notes: PrimingCandidateNote[],
	resolvedLinks: Record<string, Record<string, number>>,
	selection: PrimingSelection,
): PrimingCluster[] {
	const components = buildComponents(notes, resolvedLinks);

	const clusters: PrimingCluster[] = components.map((component) => {
		const inboundByPath = new Map<string, number>();
		for (const note of component) {
			let inbound = 0;
			for (const other of component) {
				if (other.path === note.path) {
					continue;
				}
				inbound += resolvedLinks[other.path]?.[note.path] ?? 0;
			}
			inboundByPath.set(note.path, inbound);
		}

		const orderedNotes = [...component].sort((a, b) => {
			const inboundDiff = (inboundByPath.get(b.path) ?? 0) - (inboundByPath.get(a.path) ?? 0);
			if (inboundDiff !== 0) {
				return inboundDiff;
			}
			const difficultyDiff = b.averageDifficulty - a.averageDifficulty;
			if (difficultyDiff !== 0) {
				return difficultyDiff;
			}
			return a.path.localeCompare(b.path);
		});

		const clusterCards = component.flatMap((note) => note.cards);
		const clusterAverage =
			clusterCards.reduce((sum, card) => sum + card.difficulty, 0) / clusterCards.length;

		return {
			title: deriveClusterTitle(component, selection),
			averageDifficulty: clusterAverage,
			notes: orderedNotes.map((note) => ({
				path: note.path,
				title: note.file.basename,
				averageDifficulty: note.averageDifficulty,
				inboundLinkCount: inboundByPath.get(note.path) ?? 0,
				file: note.file,
				cards: note.cards.map((card) => ({ uuid: card.uuid, difficulty: card.difficulty })),
			})),
		};
	});

	clusters.sort((a, b) => {
		const difficultyDiff = b.averageDifficulty - a.averageDifficulty;
		if (difficultyDiff !== 0) {
			return difficultyDiff;
		}
		const firstANote = a.notes[0]?.path ?? '';
		const firstBNote = b.notes[0]?.path ?? '';
		return firstANote.localeCompare(firstBNote);
	});

	return clusters;
}

export class PrimingController {
	private readonly app: App;
	private availabilityQueue: Promise<void> = Promise.resolve();

	constructor(app: App) {
		this.app = app;
	}

	hasEligiblePrimingNotes(selection: PrimingSelection, threshold: number): Promise<boolean> {
		const request = this.availabilityQueue.then(async () => {
			const candidates = await this.queryCandidates(
				selection,
				threshold,
				new Date(),
				undefined,
				true,
			);
			return discoverPrimingCandidates(candidates, this.app).length > 0;
		});

		this.availabilityQueue = request.then(
			() => undefined,
			() => undefined,
		);

		return request;
	}

	async start(selection: PrimingSelection): Promise<void> {
		const generation = ++globalGeneration;
		uiStore.currentView = 'priming';

		const threshold =
			settingsStore.currentSettings.source_note.priming?.difficulty_threshold ??
			DEFAULT_PRIMING_THRESHOLD;

		primingStore.store.update((state) => ({
			...state,
			status: 'loading',
			selection,
			threshold,
			clusters: [],
			notes: [],
			currentIndex: 0,
			currentContent: null,
			error: null,
		}));

		const now = new Date();
		let candidates: FlashcardMetadata[];
		try {
			candidates = await this.queryCandidates(selection, threshold, now, generation);
		} catch (error) {
			if (generation !== globalGeneration) {
				return;
			}
			this.setUnavailable(selection, threshold, error);
			return;
		}
		if (generation !== globalGeneration) {
			return;
		}

		if (candidates.length === 0) {
			this.setEmpty(selection, threshold);
			return;
		}

		let clusters: PrimingCluster[];
		try {
			clusters = this.computeClusters(candidates, selection);
		} catch (error) {
			if (generation !== globalGeneration) {
				return;
			}
			this.setUnavailable(selection, threshold, error);
			return;
		}
		if (generation !== globalGeneration) {
			return;
		}

		const notes = flattenPrimingClusters(clusters);
		if (notes.length === 0) {
			this.setEmpty(selection, threshold);
			return;
		}

		let content: string;
		try {
			content = await this.readCurrentNote(notes[0], generation);
		} catch (error) {
			if (generation !== globalGeneration) {
				return;
			}
			if (error instanceof PrimingRequestCancelledError) {
				return;
			}
			this.setUnavailable(selection, threshold, error);
			return;
		}
		if (generation !== globalGeneration) {
			return;
		}

		const first = notes[0];
		primingStore.store.update((state) => ({
			...state,
			status: 'ready',
			clusters,
			notes,
			currentIndex: 0,
			currentContent: {
				path: first.path,
				title: first.title,
				averageDifficulty: first.averageDifficulty,
				file: first.file,
				content,
			},
			error: null,
		}));
	}

	async retry(): Promise<void> {
		const state = primingStore.state;
		await this.start(state.selection);
	}

	async select(index: number): Promise<void> {
		const state = primingStore.state;
		if (state.status !== 'ready') {
			return;
		}
		const note = state.notes[index];
		if (!note) {
			return;
		}

		const generation = ++globalGeneration;
		primingStore.store.update((s) => (s.status === 'ready' ? { ...s, currentIndex: index } : s));

		try {
			const content = await this.readCurrentNote(note, generation);
			if (generation !== globalGeneration) {
				return;
			}
			primingStore.store.update((s) =>
				s.status === 'ready'
					? {
							...s,
							currentContent: {
								path: note.path,
								title: note.title,
								averageDifficulty: note.averageDifficulty,
								file: note.file,
								content,
							},
						}
					: s,
			);
		} catch (error) {
			if (generation !== globalGeneration) {
				return;
			}
			if (error instanceof PrimingRequestCancelledError) {
				return;
			}
			this.setUnavailable(state.selection, state.threshold, error);
		}
	}

	async previous(): Promise<void> {
		const state = primingStore.state;
		if (state.status !== 'ready' || state.currentIndex <= 0) {
			return;
		}
		await this.select(state.currentIndex - 1);
	}

	async nextOrBeginReview(): Promise<void> {
		const state = primingStore.state;
		if (state.status === 'loading') {
			return;
		}
		if (state.status === 'ready' && state.currentIndex < state.notes.length - 1) {
			await this.select(state.currentIndex + 1);
			return;
		}
		await this.beginReview(state.selection);
	}

	exit(): void {
		++globalGeneration;
		primingStore.reset();
		uiStore.currentView = 'dashboard';
	}

	private queryCandidates(
		selection: PrimingSelection,
		threshold: number,
		now: Date,
		generation?: number,
		strict = false,
	): Promise<FlashcardMetadata[]> {
		return new Promise((resolve, reject) => {
			const unsubscribe = EventBus.instance.subscribe(
				FlashcardIndexQueryResponseEvent,
				async (event) => {
					unsubscribe();
					resolve(event.data);
				},
			);

			const queryRequest = new FlashcardIndexQueryRequestEvent({
				predicate: (entity: FlashcardMetadata) =>
					filterPrimingCandidates([entity], selection, threshold, now).length > 0,
			});
			const publish = strict
				? EventBus.instance.publishStrict(queryRequest)
				: EventBus.instance.publish(queryRequest);
			void publish
				.catch((error: Error) => {
					unsubscribe();
					if (generation !== undefined && generation !== globalGeneration) {
						reject(new PrimingRequestCancelledError());
						return;
					}
					reject(error);
				});
		});
	}

	private computeClusters(
		candidates: FlashcardMetadata[],
		selection: PrimingSelection,
	): PrimingCluster[] {
		const notes = discoverPrimingCandidates(candidates, this.app);
		const resolvedLinks = this.app.metadataCache.resolvedLinks ?? {};
		return buildPrimingClusters(candidates, notes, resolvedLinks, selection);
	}

	private async readCurrentNote(note: PrimingNote, generation: number): Promise<string> {
		const content = await this.app.vault.cachedRead(note.file);
		if (generation !== globalGeneration) {
			throw new PrimingRequestCancelledError();
		}
		return content;
	}

	private setEmpty(selection: PrimingSelection, threshold: number): void {
		primingStore.store.update((state) => ({
			...state,
			status: 'empty',
			selection,
			threshold,
			clusters: [],
			notes: [],
			currentIndex: 0,
			currentContent: null,
			error: null,
		}));
	}

	private setUnavailable(selection: PrimingSelection, threshold: number, error: unknown): void {
		primingStore.store.update((state) => ({
			...state,
			status: 'unavailable',
			selection,
			threshold,
			clusters: [],
			notes: [],
			currentIndex: 0,
			currentContent: null,
			error: error instanceof Error ? error.message : 'Unknown error',
		}));
	}

	private async beginReview(selection: PrimingSelection): Promise<void> {
		this.exit();
		await new DashboardController().startReview(IndexKey.flashcard, selection.deckFilter);
	}
}
