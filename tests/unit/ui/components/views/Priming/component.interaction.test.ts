// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import { Component } from 'obsidian';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '@/modules/events';
import { FlashcardMetadata } from '@/schemas';
import {
	PrimingCluster,
	PrimingNote,
	primingStore,
} from '@/ui/store/priming.store';
import { sessionStore } from '@/ui/store/session.store';
import { uiStore } from '@/ui/store/ui.store';
import { createFlashcardMetadata } from '../../../../../helpers/factories';
import {
	createMockMetadataCache,
	createMockPlugin,
} from '../../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import PrimingHarness from '../../../../../helpers/PrimingHarness.svelte';

async function flush(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

function wireIndexerResponse(getCards: () => FlashcardMetadata[]): void {
	EventBus.instance.subscribe(FlashcardIndexQueryRequestEvent, async (event) => {
		const predicate = event.data.predicate;
		void EventBus.instance.publish(
			new FlashcardIndexQueryResponseEvent(getCards().filter(predicate)),
		);
	});
}

describe('Priming view interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;
	let plugin: any;

	beforeEach(() => {
		resetSingletons();
		primingStore.reset();
		uiStore.currentView = 'dashboard';
		sessionStore.reset();
		plugin = createMockPlugin([
			{ path: 'notes/Alpha.md', content: '# Alpha body' },
			{ path: 'notes/Beta.md', content: '# Beta body' },
		]);
		plugin.app.metadataCache = createMockMetadataCache(undefined, undefined, {
			linkTargets: { 'notes/Alpha': 'notes/Alpha.md', 'notes/Beta': 'notes/Beta.md' },
		});
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
	});

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	function mountView() {
		instance = mount(PrimingHarness, {
			target,
			props: { app: plugin.app, component: new Component() },
		});
		return flush();
	}

	function seedReady(index = 0) {
		const alpha = plugin.app.vault.getFileByPath('notes/Alpha.md');
		const beta = plugin.app.vault.getFileByPath('notes/Beta.md');
		const alphaNote: PrimingNote = {
			path: 'notes/Alpha.md',
			title: 'Alpha',
			averageDifficulty: 8.2,
			inboundLinkCount: 5,
			file: alpha,
			cards: [],
		};
		const betaNote: PrimingNote = {
			path: 'notes/Beta.md',
			title: 'Beta',
			averageDifficulty: 7.5,
			inboundLinkCount: 2,
			file: beta,
			cards: [],
		};
		const clusters: PrimingCluster[] = [
			{ title: 'Graph algorithms', averageDifficulty: 7.9, notes: [alphaNote, betaNote] },
		];
		primingStore.store.set({
			status: 'ready',
			selection: { deckFilter: 'Informatics', deckLabel: 'Informatics' },
			threshold: 7,
			clusters,
			notes: [alphaNote, betaNote],
			currentIndex: index,
			currentContent: {
				path: (index === 0 ? alphaNote : betaNote).path,
				title: (index === 0 ? alphaNote : betaNote).title,
				averageDifficulty: (index === 0 ? alphaNote : betaNote).averageDifficulty,
				file: (index === 0 ? alphaNote : betaNote).file,
				content: index === 0 ? '# Alpha body' : '# Beta body',
			},
			error: null,
		});
	}

	function findButton(text: string): HTMLButtonElement | null {
		const buttons = Array.from(target.querySelectorAll<HTMLButtonElement>('button'));
		for (const button of buttons) {
			if (button.textContent?.includes(text)) {
				return button;
			}
		}
		return null;
	}

	it('renders the loading state with header, context chips, and exit', async () => {
		await mountView();

		expect(target.textContent).toContain('← Dashboard');
		expect(target.textContent).toContain('Prime difficult notes');
		expect(target.textContent).toContain('Review the connected material before your cards');
		expect(target.textContent).toContain('All decks');
		expect(target.textContent).toContain('Difficulty > 7.0');
		expect(target.textContent).toContain('Finding difficult notes');
	});

	it('renders the empty state and exits to the dashboard', async () => {
		primingStore.store.set({
			status: 'empty',
			selection: { deckFilter: 'Informatics', deckLabel: 'Informatics' },
			threshold: 7,
			clusters: [],
			notes: [],
			currentIndex: 0,
			currentContent: null,
			error: null,
		});
		await mountView();

		expect(target.textContent).toContain('No difficult notes to prime');
		expect(target.textContent).toContain(
			'No active cards due now in Informatics are above difficulty 7.0.',
		);

		findButton('Back to dashboard')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		expect(uiStore.currentView).toBe('dashboard');
	});

	it('renders the unavailable state and retries into ready', async () => {
		primingStore.store.set({
			status: 'unavailable',
			selection: { deckFilter: 'Informatics', deckLabel: 'Informatics' },
			threshold: 7,
			clusters: [],
			notes: [],
			currentIndex: 0,
			currentContent: null,
			error: 'boom',
		});
		wireIndexerResponse(() => [
			createFlashcardMetadata({
				uuid: '00000000-0000-0000-0000-000000000001',
				due: '2026-08-29T10:00:00.000Z',
				difficulty: 8.2,
				source: '[[notes/Alpha]]',
				decks: ['Informatics'],
			}),
		]);
		await mountView();

		expect(target.textContent).toContain('Couldn’t prepare your note map');
		expect(target.textContent).toContain('Check your vault links and try again.');

		findButton('Try again')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		await flush();

		expect(primingStore.state.status).toBe('ready');
		expect(target.textContent).toContain('1 of 1 notes');
	});

	it('renders the ready reader with progress, outline, and one-decimal metrics', async () => {
		seedReady(0);
		await mountView();

		expect(target.textContent).toContain('1 of 2 notes');
		expect(target.textContent).toContain('Backlink clusters');
		expect(target.textContent).toContain('Graph algorithms');
		expect(target.textContent).toContain('Cluster average 7.9');
		expect(target.textContent).toContain('5 inbound links');
		expect(target.textContent).toContain('Average difficulty 8.2');
		expect(target.textContent).toContain('Alpha');
	});

	it('navigates with Previous and Next respecting bounds and switches to Begin review on the final note', async () => {
		seedReady(0);
		await mountView();

		const previous = findButton('Previous note');
		expect(previous?.disabled).toBe(true);

		const next = findButton('Next note');
		expect(next).not.toBeNull();
		next?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		await flush();

		expect(primingStore.state.currentIndex).toBe(1);
		expect(target.textContent).toContain('2 of 2 notes');
		expect(primingStore.state.currentContent?.content).toBe('# Beta body');

		const previousEnabled = findButton('Previous note');
		expect(previousEnabled?.disabled).toBe(false);
		expect(findButton('Begin review')).not.toBeNull();
		expect(findButton('Next note')).toBeNull();

		previousEnabled?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		await flush();

		expect(primingStore.state.currentIndex).toBe(0);
	});

	it('selecting an outline row reads and shows that note', async () => {
		seedReady(0);
		await mountView();

		const rows = target.querySelectorAll<HTMLButtonElement>(
			'.ml-priming__outline-stack .ml-priming__note-row',
		);
		expect(rows.length).toBe(2);
		expect(rows[0].getAttribute('aria-current')).toBe('true');

		rows[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		await flush();

		expect(primingStore.state.currentIndex).toBe(1);
		expect(primingStore.state.currentContent?.path).toBe('notes/Beta.md');
	});

	it('Begin review on the final note hands off to normal review', async () => {
		seedReady(1);
		await mountView();

		findButton('Begin review')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		await flush();
		await flush();

		expect(sessionStore.state.review_type).toBe('flashcard');
		expect(sessionStore.state.deck_filter).toBe('Informatics');
		expect(uiStore.currentView).toBe('review');
	});
});
