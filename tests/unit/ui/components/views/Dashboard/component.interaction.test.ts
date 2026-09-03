// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { Component, type App } from 'obsidian';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '@/modules/events';
import { DEFAULT_STATISTICS } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import DashboardHarness from '../../../../../helpers/DashboardHarness.svelte';
import { createFlashcardMetadata } from '../../../../../helpers/factories';
import { createMockMetadataCache, createMockPlugin } from '../../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { buildDeckTree, deckTreeStore, type DeckNode } from '@/ui/store/deck-tree.store';
import { settingsStore } from '@/ui/store/settings.store';
import { statsStore } from '@/ui/store/stats.store';
import { uiStore } from '@/ui/store/ui.store';

const DUE_NOW = '2026-08-29T10:00:00.000Z';

async function flush(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await tick();
	await Promise.resolve();
}

function makeCards(): FlashcardMetadata[] {
	return [
		createFlashcardMetadata({
			uuid: 'eligible',
			due: DUE_NOW,
			difficulty: 8.0,
			source: '[[notes/Alpha]]',
			decks: ['Eligible'],
		}),
		createFlashcardMetadata({
			uuid: 'no-notes',
			due: DUE_NOW,
			difficulty: 8.0,
			source: '[[notes/Missing]]',
			decks: ['NoNotes'],
		}),
		createFlashcardMetadata({
			uuid: 'future',
			due: '2026-09-15T10:00:00.000Z',
			difficulty: 8.0,
			source: '[[notes/Alpha]]',
			decks: ['Future'],
		}),
	];
}

function buildNodeMap(nodes: DeckNode[]): Map<string, DeckNode> {
	const map = new Map<string, DeckNode>();
	const visit = (node: DeckNode) => {
		map.set(node.fullPath, node);
		for (const child of node.children) visit(child);
	};
	for (const node of nodes) visit(node);
	return map;
}

function wireIndexerResponse(getCards: () => FlashcardMetadata[]): void {
	EventBus.instance.subscribe(FlashcardIndexQueryRequestEvent, (event) =>
		EventBus.instance
			.publish(
				new FlashcardIndexQueryResponseEvent(getCards().filter(event.data.predicate)),
			)
			.then(() => undefined),
	);
}

function wireDeferredIndexerResponse(getCards: () => FlashcardMetadata[]) {
	const releases: Array<() => void> = [];
	let requestCount = 0;

	EventBus.instance.subscribe(FlashcardIndexQueryRequestEvent, (event) => {
		requestCount += 1;
		const response = new FlashcardIndexQueryResponseEvent(getCards().filter(event.data.predicate));
		let resolveRequest!: () => void;
		const settled = new Promise<void>((resolve) => {
			resolveRequest = resolve;
		});
		releases.push(() => {
			void EventBus.instance.publish(response).then(() => resolveRequest());
		});
		return settled;
	});

	return { releases, getRequestCount: () => requestCount };
}

describe('Dashboard priming availability', () => {
	let target: HTMLDivElement;
	let instance: Record<string, unknown> | undefined;
	let plugin: { app: App };
	let cards: FlashcardMetadata[];

	beforeEach(() => {
		resetSingletons();
		uiStore.currentView = 'dashboard';
		uiStore.isLoading = false;
		settingsStore.settings.set(DEFAULT_PLUGIN_SETTINGS);
		statsStore.store.set({
			...DEFAULT_STATISTICS,
			flashcard: { ...DEFAULT_STATISTICS.flashcard, total_cards: 3, due_now: 2 },
		});
		cards = makeCards();
		plugin = createMockPlugin([{ path: 'notes/Alpha.md', content: '# Alpha body' }]);
		Object.assign(plugin.app, {
			metadataCache: createMockMetadataCache(undefined, undefined, {
				linkTargets: { 'notes/Alpha': 'notes/Alpha.md' },
			}),
		});
		const nodes = buildDeckTree(cards);
		deckTreeStore.store.set({
			nodes,
			nodeMap: buildNodeMap(nodes),
			selectedDeck: null,
		});
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
	});

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	function mountDashboard() {
		instance = mount(DashboardHarness, {
			target,
			props: { app: plugin.app, component: new Component() },
		});
		return flush();
	}

	function findPrimeButton(): HTMLButtonElement {
		return target.querySelector<HTMLButtonElement>('.ml-prime-button')!;
	}

	function findDeck(name: string): HTMLElement {
		const rows = Array.from(
			target.querySelectorAll<HTMLElement>('.ml-deck-tree-node__content'),
		);
		return rows.find((row) => row.textContent?.includes(name))!;
	}

	it('enables All decks after a resolved eligible note is found', async () => {
		wireIndexerResponse(() => cards);
		await mountDashboard();

		expect(findPrimeButton().disabled).toBe(false);
		expect(target.querySelector('.ml-dashboard__study-actions__deck')?.textContent).toContain(
			'All decks',
		);
		expect(target.textContent).toContain('Difficulty > 7.0');
		expect(target.textContent).toContain('Review 2 due cards');
		expect(target.querySelector('.ml-start-button')?.getAttribute('disabled')).toBeNull();
	});

	it('shows the empty priming state for a due-card deck without a resolvable note', async () => {
		wireIndexerResponse(() => cards);
		await mountDashboard();

		findDeck('NoNotes').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		expect(target.querySelector('.ml-dashboard__study-actions__deck')?.textContent).toContain(
			'NoNotes',
		);
		expect(findPrimeButton().disabled).toBe(true);
		expect(target.textContent).toContain('No difficult notes due');
	});

	it('disables review for a selected deck with zero due cards', async () => {
		wireIndexerResponse(() => cards);
		await mountDashboard();

		findDeck('Future').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		const review = target.querySelector<HTMLButtonElement>('.ml-start-button');
		expect(review?.textContent).toContain('All caught up!');
		expect(review?.getAttribute('disabled')).not.toBeNull();
		expect(findPrimeButton().disabled).toBe(true);
		expect(target.textContent).toContain('No difficult notes due');
	});

	it('ignores stale selection results while availability is resolving', async () => {
		const deferred = wireDeferredIndexerResponse(() => cards);
		await mountDashboard();
		expect(deferred.getRequestCount()).toBe(1);
		expect(findPrimeButton().disabled).toBe(true);

		findDeck('NoNotes').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(findPrimeButton().disabled).toBe(true);
		expect(deferred.getRequestCount()).toBe(1);

		deferred.releases[0]!();
		await flush();
		expect(deferred.getRequestCount()).toBe(2);
		expect(findPrimeButton().disabled).toBe(true);

		deferred.releases[1]!();
		await flush();
		expect(findPrimeButton().disabled).toBe(true);
	});

	it('rechecks availability when the threshold changes', async () => {
		wireIndexerResponse(() => cards);
		await mountDashboard();
		expect(findPrimeButton().disabled).toBe(false);

		settingsStore.settings.set({
			...DEFAULT_PLUGIN_SETTINGS,
			source_note: {
				...DEFAULT_PLUGIN_SETTINGS.source_note,
				priming: { difficulty_threshold: 9.0 },
			},
		});
		await flush();

		expect(findPrimeButton().disabled).toBe(true);
		expect(target.querySelector('.ml-start-button')?.getAttribute('disabled')).toBeNull();
	});
});
