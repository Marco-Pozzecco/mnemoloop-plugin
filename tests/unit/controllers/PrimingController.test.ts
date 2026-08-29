import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '@/modules/events';
import { CardStatus, FlashcardMetadata } from '@/schemas';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import {
	PrimingController,
	buildPrimingClusters,
	discoverPrimingCandidates,
	filterPrimingCandidates,
	sourceLinkToPath,
} from '@/ui/controllers/PrimingController';
import { primingStore } from '@/ui/store/priming.store';
import { sessionStore } from '@/ui/store/session.store';
import { settingsStore } from '@/ui/store/settings.store';
import { uiStore } from '@/ui/store/ui.store';
import { createFlashcardMetadata } from '../../helpers/factories';
import {
	MockFile,
	createMockMetadataCache,
	createMockPlugin,
} from '../../helpers/mock-obsidian';
import { resetSingletons } from '../../helpers/reset-singletons';

// Avoid EventBus side effects from the normal review queue during handoff tests.
vi.mock('@/modules/review-queues/FlashcardReviewQueue', () => ({
	FlashcardReviewQueue: vi.fn().mockImplementation(() => ({
		recalc: vi.fn(),
		dispose: vi.fn(),
	})),
}));

const DUE_NOW = '2026-08-29T10:00:00.000Z';

let cardCounter = 0;

function makeCard(overrides: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	cardCounter += 1;
	return createFlashcardMetadata({
		uuid: `00000000-0000-0000-0000-${String(cardCounter).padStart(12, '0')}`,
		due: DUE_NOW,
		difficulty: 8.0,
		source: '[[notes/Alpha.md]]',
		decks: ['Informatics::Graph algorithms'],
		...overrides,
	});
}

function wireIndexerResponse(getCards: () => FlashcardMetadata[]): void {
	EventBus.instance.subscribe(FlashcardIndexQueryRequestEvent, async (event) => {
		const predicate = event.data.predicate;
		void EventBus.instance.publish(
			new FlashcardIndexQueryResponseEvent(getCards().filter(predicate)),
		);
	});
}

function setThreshold(value: number): void {
	settingsStore.settings.set({
		...DEFAULT_PLUGIN_SETTINGS,
		source_note: {
			...DEFAULT_PLUGIN_SETTINGS.source_note,
			priming: { difficulty_threshold: value },
		},
	});
}

function resetTestState(): void {
	resetSingletons();
	vi.clearAllMocks();
	primingStore.reset();
	uiStore.currentView = 'dashboard';
	uiStore.isLoading = false;
	sessionStore.reset();
	settingsStore.settings.set(DEFAULT_PLUGIN_SETTINGS);
	cardCounter = 0;
}

function setupReadyController(files: MockFile[]): { plugin: any; controller: PrimingController } {
	const plugin = createMockPlugin(files);
	const linkTargets: Record<string, string> = {};
	for (const file of files) {
		const linkpath = file.path.replace(/\.md$/, '');
		linkTargets[linkpath] = file.path;
	}
	plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
		linkTargets,
		resolvedLinks: Object.fromEntries(files.map((file) => [file.path, {}])),
	});
	return { plugin, controller: new PrimingController(plugin.app) };
}

describe('PrimingController discovery helpers', () => {
	beforeEach(resetTestState);

	it('keeps only active, due, sourced cards strictly above the threshold', () => {
		const now = new Date(DUE_NOW);
		const equal = makeCard({ difficulty: 7.0 });
		const above = makeCard({ difficulty: 7.1 });
		const paused = makeCard({ status: CardStatus.PAUSED, difficulty: 8.0 });
		const future = makeCard({ due: '2099-01-01T00:00:00.000Z', difficulty: 8.0 });
		const unsourced = makeCard({ source: null, difficulty: 8.0 });

		const result = filterPrimingCandidates(
			[equal, above, paused, future, unsourced],
			{ deckFilter: undefined, deckLabel: 'All decks' },
			7.0,
			now,
		);

		expect(result.map((card) => card.uuid)).toEqual([above.uuid]);
	});

	it('applies named nested-deck, Uncategorized, and All-decks selection semantics', () => {
		const now = new Date(DUE_NOW);
		const nested = makeCard({ decks: ['Informatics::Graph algorithms'] });
		const prefixed = makeCard({ decks: ['InformaticsX'] });
		const unrelated = makeCard({ decks: ['Math::Informatics'] });
		const uncategorized = makeCard({ decks: [] });

		const named = filterPrimingCandidates(
			[nested, prefixed, unrelated, uncategorized],
			{ deckFilter: 'Informatics', deckLabel: 'Informatics' },
			7.0,
			now,
		);
		expect(named.map((card) => card.uuid)).toEqual([nested.uuid]);

		const onlyUncategorized = filterPrimingCandidates(
			[nested, uncategorized],
			{ deckFilter: 'Uncategorized', deckLabel: 'Uncategorized' },
			7.0,
			now,
		);
		expect(onlyUncategorized.map((card) => card.uuid)).toEqual([uncategorized.uuid]);

		const all = filterPrimingCandidates(
			[nested, prefixed, unrelated, uncategorized],
			{ deckFilter: undefined, deckLabel: 'All decks' },
			7.0,
			now,
		);
		expect(all).toHaveLength(4);
	});

	it('converts a wikilink source to a linkpath', () => {
		expect(sourceLinkToPath('[[notes/Alpha|alias]]')).toBe('notes/Alpha');
		expect(sourceLinkToPath('[[notes/Alpha#heading]]')).toBe('notes/Alpha');
	});

	it('resolves sources, groups qualifying cards per note, and skips unresolved targets', () => {
		const plugin = createMockPlugin([
			{ path: 'notes/Alpha.md', content: '# Alpha' },
			{ path: 'notes/Beta.md', content: '# Beta' },
		]);
		plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
			linkTargets: { 'notes/Alpha': 'notes/Alpha.md' },
		});

		const cards = [
			makeCard({ source: '[[notes/Alpha]]', difficulty: 8.0 }),
			makeCard({ source: '[[notes/Alpha]]', difficulty: 6.0 }),
			makeCard({ source: '[[notes/Beta]]', difficulty: 9.0 }),
			makeCard({ source: '[[missing/Note]]', difficulty: 9.0 }),
		];

		const notes = discoverPrimingCandidates(cards, plugin.app);

		expect(notes.map((note) => note.path)).toEqual(['notes/Alpha.md']);
		expect(notes[0].averageDifficulty).toBe(7.0);
		expect(notes[0].cards).toHaveLength(2);
	});

	it('ignores non-Markdown source targets', () => {
		const plugin = createMockPlugin([]);
		plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
			linkTargets: { 'notes/Alpha': 'notes/Alpha.pdf' },
		});

		const notes = discoverPrimingCandidates(
			[makeCard({ source: '[[notes/Alpha]]' })],
			plugin.app,
		);

		expect(notes).toHaveLength(0);
	});

	it('builds weakly connected backlink clusters with inbound-count ordering and shared-subdeck titles', () => {
		const plugin = createMockPlugin([]);
		plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
			linkTargets: {
				'notes/Alpha': 'notes/Alpha.md',
				'notes/Beta': 'notes/Beta.md',
				'notes/Gamma': 'notes/Gamma.md',
				'notes/Delta': 'notes/Delta.md',
			},
			resolvedLinks: {
				'notes/Alpha.md': { 'notes/Beta.md': 3 },
				'notes/Beta.md': { 'notes/Alpha.md': 1, 'notes/Gamma.md': 2 },
				'notes/Gamma.md': {},
				'notes/Delta.md': {},
			},
		});

		const cards = [
			makeCard({ source: '[[notes/Alpha]]', difficulty: 8.2, decks: ['Informatics::Graph algorithms'] }),
			makeCard({ source: '[[notes/Beta]]', difficulty: 7.8, decks: ['Informatics::Graph algorithms'] }),
			makeCard({ source: '[[notes/Gamma]]', difficulty: 7.3, decks: ['Informatics::Graph algorithms'] }),
			makeCard({ source: '[[notes/Delta]]', difficulty: 9.0, decks: ['Informatics::Other'] }),
		];
		const notes = discoverPrimingCandidates(cards, plugin.app);
		const clusters = buildPrimingClusters(
			cards,
			notes,
			plugin.app.metadataCache.resolvedLinks,
			{ deckFilter: 'Informatics', deckLabel: 'Informatics' },
		);

		expect(clusters).toHaveLength(2);

		const deltaCluster = clusters.find((cluster) =>
			cluster.notes.some((note) => note.path === 'notes/Delta.md'),
		);
		const graphCluster = clusters.find((cluster) =>
			cluster.notes.some((note) => note.path === 'notes/Alpha.md'),
		);

		expect(deltaCluster?.title).toBe('Other');
		expect(graphCluster?.title).toBe('Graph algorithms');

		const beta = graphCluster?.notes.find((note) => note.path === 'notes/Beta.md');
		const gamma = graphCluster?.notes.find((note) => note.path === 'notes/Gamma.md');
		const alpha = graphCluster?.notes.find((note) => note.path === 'notes/Alpha.md');
		expect(beta?.inboundLinkCount).toBe(3);
		expect(gamma?.inboundLinkCount).toBe(2);
		expect(alpha?.inboundLinkCount).toBe(1);

		expect(graphCluster?.notes.map((note) => note.path)).toEqual([
			'notes/Beta.md',
			'notes/Gamma.md',
			'notes/Alpha.md',
		]);

		expect(deltaCluster?.averageDifficulty).toBe(9.0);
		expect(graphCluster?.averageDifficulty).toBeCloseTo((8.2 + 7.8 + 7.3) / 3);
		expect(clusters[0].notes[0].path).toBe('notes/Delta.md');
	});

	it('leaves titles null when notes share no common deck below the selection', () => {
		const plugin = createMockPlugin([]);
		plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
			linkTargets: {
				'notes/Alpha': 'notes/Alpha.md',
				'notes/Beta': 'notes/Beta.md',
			},
			resolvedLinks: {
				'notes/Alpha.md': { 'notes/Beta.md': 1 },
				'notes/Beta.md': {},
			},
		});

		const cards = [
			makeCard({ source: '[[notes/Alpha]]', decks: ['Informatics::Graph algorithms'] }),
			makeCard({ source: '[[notes/Beta]]', decks: ['Informatics::Linear algebra'] }),
		];
		const notes = discoverPrimingCandidates(cards, plugin.app);
		const clusters = buildPrimingClusters(
			cards,
			notes,
			plugin.app.metadataCache.resolvedLinks,
			{ deckFilter: 'Informatics', deckLabel: 'Informatics' },
		);

		expect(clusters[0].title).toBeNull();
	});

	it('renders full-path cluster titles for All decks', () => {
		const plugin = createMockPlugin([]);
		plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
			linkTargets: {
				'notes/Alpha': 'notes/Alpha.md',
				'notes/Beta': 'notes/Beta.md',
			},
			resolvedLinks: {
				'notes/Alpha.md': { 'notes/Beta.md': 1 },
				'notes/Beta.md': {},
			},
		});

		const cards = [
			makeCard({ source: '[[notes/Alpha]]', decks: ['Informatics::Graph algorithms'] }),
			makeCard({ source: '[[notes/Beta]]', decks: ['Informatics::Graph algorithms'] }),
		];
		const notes = discoverPrimingCandidates(cards, plugin.app);
		const clusters = buildPrimingClusters(
			cards,
			notes,
			plugin.app.metadataCache.resolvedLinks,
			{ deckFilter: undefined, deckLabel: 'All decks' },
		);

		expect(clusters[0].title).toBe('Informatics::Graph algorithms');
	});
});

describe('PrimingController flow', () => {
	beforeEach(resetTestState);

	it('transitions loading to ready, reads only the first note, and leaves SessionStore untouched', async () => {
		const { plugin, controller } = setupReadyController([
			{ path: 'notes/Alpha.md', content: '# Alpha body' },
			{ path: 'notes/Beta.md', content: '# Beta body' },
		]);
		wireIndexerResponse(() => [
			makeCard({ source: '[[notes/Alpha]]', difficulty: 8.2, decks: ['Informatics'] }),
			makeCard({ source: '[[notes/Beta]]', difficulty: 7.5, decks: ['Informatics'] }),
		]);

		const startPromise = controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });

		expect(primingStore.state.status).toBe('loading');
		expect(uiStore.currentView).toBe('priming');

		await startPromise;

		const state = primingStore.state;
		expect(state.status).toBe('ready');
		expect(state.selection).toEqual({ deckFilter: 'Informatics', deckLabel: 'Informatics' });
		expect(state.threshold).toBe(7.0);
		expect(state.currentIndex).toBe(0);
		expect(state.currentContent?.path).toBe('notes/Alpha.md');
		expect(state.currentContent?.content).toBe('# Alpha body');
		expect(state.currentContent?.averageDifficulty).toBe(8.2);
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(1);
		expect(sessionStore.state.session_id).toBeNull();
		expect(sessionStore.state.queue).toBeNull();
	});

	it('captures the configured threshold at start and filters strictly', async () => {
		setThreshold(6.5);
		const { controller } = setupReadyController([{ path: 'notes/Alpha.md', content: '# Alpha' }]);
		wireIndexerResponse(() => [
			makeCard({ source: '[[notes/Alpha]]', difficulty: 6.6 }),
			makeCard({ source: '[[notes/Alpha]]', difficulty: 6.4 }),
		]);

		await controller.start({ deckFilter: undefined, deckLabel: 'All decks' });

		const state = primingStore.state;
		expect(state.status).toBe('ready');
		expect(state.threshold).toBe(6.5);
		expect(state.currentContent?.averageDifficulty).toBe(6.6);
	});

	it('transitions to empty when no candidate cards exist and retains selection', async () => {
		const { controller } = setupReadyController([]);
		wireIndexerResponse(() => []);

		await controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });

		expect(primingStore.state.status).toBe('empty');
		expect(primingStore.state.selection).toEqual({
			deckFilter: 'Informatics',
			deckLabel: 'Informatics',
		});
		expect(primingStore.state.threshold).toBe(7.0);
	});

	it('transitions to empty when every qualifying source is unresolved', async () => {
		const { controller } = setupReadyController([]);
		wireIndexerResponse(() => [makeCard({ source: '[[missing/Note]]' })]);

		await controller.start({ deckFilter: undefined, deckLabel: 'All decks' });

		expect(primingStore.state.status).toBe('empty');
	});

	it('transitions to unavailable when the current note read fails', async () => {
		const { plugin, controller } = setupReadyController([
			{ path: 'notes/Alpha.md', content: '# Alpha' },
		]);
		wireIndexerResponse(() => [makeCard({ source: '[[notes/Alpha]]' })]);
		plugin.app.vault.cachedRead.mockRejectedValue(new Error('read boom'));

		await controller.start({ deckFilter: undefined, deckLabel: 'All decks' });

		expect(primingStore.state.status).toBe('unavailable');
		expect(primingStore.state.selection.deckLabel).toBe('All decks');
	});

	it('ignores stale completions after exit', async () => {
		const { controller } = setupReadyController([]);
		wireIndexerResponse(() => [makeCard({})]);

		const startPromise = controller.start({ deckFilter: undefined, deckLabel: 'All decks' });
		controller.exit();

		await startPromise;

		expect(primingStore.state.status).toBe('loading');
		expect(uiStore.currentView).toBe('dashboard');
	});

	it('retry retains the selected deck and threshold', async () => {
		const { controller } = setupReadyController([{ path: 'notes/Alpha.md', content: '# Alpha' }]);
		let cards: FlashcardMetadata[] = [];
		wireIndexerResponse(() => cards);

		await controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });
		expect(primingStore.state.status).toBe('empty');

		cards = [makeCard({ source: '[[notes/Alpha]]', decks: ['Informatics'] })];
		await controller.retry();

		expect(primingStore.state.status).toBe('ready');
		expect(primingStore.state.selection).toEqual({
			deckFilter: 'Informatics',
			deckLabel: 'Informatics',
		});
		expect(primingStore.state.threshold).toBe(7.0);
	});

	it('select reads only the selected note and previous respects the first bound', async () => {
		const { plugin, controller } = setupReadyController([
			{ path: 'notes/Alpha.md', content: '# Alpha body' },
			{ path: 'notes/Beta.md', content: '# Beta body' },
		]);
		wireIndexerResponse(() => [
			makeCard({ source: '[[notes/Alpha]]', decks: ['Informatics'] }),
			makeCard({ source: '[[notes/Beta]]', decks: ['Informatics'] }),
		]);

		await controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(1);

		await controller.previous();
		expect(primingStore.state.currentIndex).toBe(0);
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(1);

		await controller.nextOrBeginReview();
		expect(primingStore.state.currentIndex).toBe(1);
		expect(primingStore.state.currentContent?.path).toBe('notes/Beta.md');
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(2);

		await controller.select(0);
		expect(primingStore.state.currentIndex).toBe(0);
		expect(primingStore.state.currentContent?.path).toBe('notes/Alpha.md');
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(3);
	});

	it('ignores stale select completions after a newer selection', async () => {
		const { plugin, controller } = setupReadyController([
			{ path: 'notes/Alpha.md', content: '# Alpha body' },
			{ path: 'notes/Beta.md', content: '# Beta body' },
		]);
		wireIndexerResponse(() => [
			makeCard({ source: '[[notes/Alpha]]', decks: ['Informatics'] }),
			makeCard({ source: '[[notes/Beta]]', decks: ['Informatics'] }),
		]);

		const gates: Array<() => void> = [];
		let readCall = 0;
		plugin.app.vault.cachedRead.mockImplementation(() => {
			readCall += 1;
			if (readCall === 1) {
				return Promise.resolve('# Alpha body');
			}
			return new Promise<string>((resolve) => {
				gates.push(() => resolve('body'));
			});
		});

		await controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });
		expect(primingStore.state.currentIndex).toBe(0);

		const selectBeta = controller.select(1);
		const selectAlpha = controller.select(0);

		gates[1]();
		await selectAlpha;
		expect(primingStore.state.currentIndex).toBe(0);
		expect(primingStore.state.currentContent?.path).toBe('notes/Alpha.md');

		gates[0]();
		await selectBeta;
		expect(primingStore.state.currentIndex).toBe(0);
		expect(primingStore.state.currentContent?.path).toBe('notes/Alpha.md');
	});

	it('hands off to normal review from the final note with the retained deck filter', async () => {
		const { controller } = setupReadyController([
			{ path: 'notes/Alpha.md', content: '# Alpha body' },
			{ path: 'notes/Beta.md', content: '# Beta body' },
		]);
		wireIndexerResponse(() => [
			makeCard({ source: '[[notes/Alpha]]', decks: ['Informatics'] }),
			makeCard({ source: '[[notes/Beta]]', decks: ['Informatics'] }),
		]);

		await controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });
		await controller.nextOrBeginReview();
		await controller.nextOrBeginReview();

		expect(sessionStore.state.deck_filter).toBe('Informatics');
		expect(sessionStore.state.review_type).toBe('flashcard');
		expect(sessionStore.state.session_id).not.toBeNull();
		expect(uiStore.currentView).toBe('review');
		expect(primingStore.state.status).toBe('loading');
	});

	it('hands off to normal review from the empty state', async () => {
		const { controller } = setupReadyController([]);
		wireIndexerResponse(() => []);

		await controller.start({ deckFilter: undefined, deckLabel: 'All decks' });
		expect(primingStore.state.status).toBe('empty');

		await controller.nextOrBeginReview();

		expect(sessionStore.state.deck_filter).toBeNull();
		expect(sessionStore.state.review_type).toBe('flashcard');
		expect(uiStore.currentView).toBe('review');
	});

	it('exit resets priming state and returns to the dashboard', async () => {
		const { controller } = setupReadyController([{ path: 'notes/Alpha.md', content: '# Alpha' }]);
		wireIndexerResponse(() => [makeCard({ source: '[[notes/Alpha]]' })]);

		await controller.start({ deckFilter: 'Informatics', deckLabel: 'Informatics' });
		expect(primingStore.state.status).toBe('ready');

		controller.exit();

		expect(primingStore.state.status).toBe('loading');
		expect(primingStore.state.selection).toEqual({
			deckFilter: undefined,
			deckLabel: 'All decks',
		});
		expect(uiStore.currentView).toBe('dashboard');
		expect(sessionStore.state.session_id).toBeNull();
	});
});
