// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills'; // MUST be the first import (side-effect polyfills)
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import ManageDeckHarness from '../../../../../helpers/ManageDeckHarness.svelte';
import { CardStatus, CardType } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';

const logs: { kind: 'warn' | 'error'; step: string; text: string }[] = [];
let currentStep = '';
function markStep(step: string) {
	currentStep = step;
}
beforeEach(() => {
	logs.length = 0;
	currentStep = '';
	vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
		logs.push({ kind: 'warn', step: currentStep, text: args.map(String).join(' ') });
	});
	vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
		logs.push({ kind: 'error', step: currentStep, text: args.map(String).join(' ') });
	});
});
afterEach(() => {
	vi.restoreAllMocks();
});

function makeCard(id: string, decks: string[]): FlashcardMetadata {
	return {
		uuid: `uuid-${id}`,
		file: `${id}.md`,
		card_type: CardType.Basic,
		status: CardStatus.ACTIVE,
		decks,
		due: 0,
	} as unknown as FlashcardMetadata;
}

function tick() {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

function plusButton(label: string): HTMLButtonElement {
	const plus = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
	if (!plus) throw new Error(`plus not found: ${label}`);
	return plus;
}

function openPicker(label: string): void {
	// bits-ui's trigger toggles on pointerdown (click only focuses the button),
	// so dispatch pointerdown to actually open/close the picker in jsdom.
	plusButton(label).dispatchEvent(
		new PointerEvent('pointerdown', {
			bubbles: true,
			button: 0,
			pointerType: 'mouse',
			cancelable: true,
		}),
	);
}

function inputEl(): HTMLInputElement {
	const input = document.querySelector<HTMLInputElement>('input.ml-combobox__input');
	if (!input) throw new Error('combobox input not found');
	return input;
}

function type(text: string): void {
	const input = inputEl();
	input.value = text;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressKey(key: string): void {
	const input = inputEl();
	input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function openContentCount(): number {
	return document.querySelectorAll('.ml-combobox__content').length;
}

function chips(rowSelector: string): string[] {
	return Array.from(
		document.querySelectorAll<HTMLElement>(`${rowSelector} .ml-chip`),
	).map((el) => el.textContent?.trim() ?? '');
}

function selectedItemLabels(): string[] {
	return Array.from(
		document.querySelectorAll<HTMLElement>(
			'.ml-combobox__item[data-selected] .ml-combobox__item-label',
		),
	).map((el) => el.textContent?.trim() ?? '');
}

describe('ManageDeckCell interaction (dual presentation)', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	beforeEach(() => {
		target = document.createElement('div');
		document.body.appendChild(target);
	});

	afterEach(() => {
		if (instance) unmount(instance);
		target.remove();
	});

	function mountHarness(cards: FlashcardMetadata[], deckOptions: string[]) {
		instance = mount(ManageDeckHarness, {
			target,
			props: { cards, deckOptions },
		});
	}

	it('opens the picker with existing decks selected and adds on click', async () => {
		markStep('mount');
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();

		markStep('open-A');
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		expect(openContentCount()).toBe(1);
		expect(inputEl()).toBeTruthy();
		// Existing decks render as selected items with a visible indicator.
		expect(selectedItemLabels()).toEqual(['Math', 'Lang']);
		// The display shows the card's decks as plain chips — no draft/remove controls.
		expect(chips('.desktop-row')).toEqual(['Math', 'Lang']);
		expect(document.querySelectorAll('.ml-combobox__chip')).toHaveLength(0);

		markStep('select');
		const spanish = Array.from(
			document.querySelectorAll<HTMLElement>('.ml-combobox__item'),
		).find((el) => el.textContent?.includes('Spanish'));
		expect(spanish).toBeTruthy();
		spanish!.dispatchEvent(
			new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }),
		);
		await tick();
		await tick();

		// The deck is added to the card; the portal stays open after the toggle.
		expect(chips('.desktop-row')).toEqual(['Math', 'Lang', 'Spanish']);
		expect(openContentCount()).toBe(1);
		expect(logs).toEqual([]);
	});

	it('deselecting a selected item removes the deck and keeps the picker open', async () => {
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		expect(selectedItemLabels()).toEqual(['Math', 'Lang']);

		const mathItem = Array.from(
			document.querySelectorAll<HTMLElement>('.ml-combobox__item'),
		).find((el) => el.textContent?.trim() === 'Math');
		expect(mathItem).toBeTruthy();
		mathItem!.dispatchEvent(
			new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }),
		);
		await tick();
		await tick();

		expect(chips('.desktop-row')).toEqual(['Lang']);
		expect(openContentCount()).toBe(1);
		expect(logs).toEqual([]);
	});

	it('creates a new deck on Enter and closes the portal', async () => {
		markStep('mount');
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();

		markStep('open');
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		markStep('type');
		type('NewDeck');
		await tick();
		await tick();
		expect(
			Array.from(document.querySelectorAll<HTMLElement>('.ml-combobox__create')).some((el) =>
				el.textContent?.includes('NewDeck'),
			),
		).toBe(true);

		markStep('enter');
		pressKey('Enter');
		await tick();
		await tick();

		expect(chips('.desktop-row')).toEqual(['Math', 'Lang', 'NewDeck']);
		expect(openContentCount()).toBe(0);
		expect(logs).toEqual([]);
	});

	it('selects an existing deck on Enter (case-insensitive) and closes', async () => {
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		type('spanish');
		await tick();
		pressKey('Enter');
		await tick();
		await tick();

		expect(chips('.desktop-row')).toEqual(['Math', 'Lang', 'Spanish']);
		expect(openContentCount()).toBe(0);
		expect(logs).toEqual([]);
	});

	it('ignores Enter with an empty value', async () => {
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		pressKey('Enter');
		await tick();
		await tick();

		expect(chips('.desktop-row')).toEqual(['Math', 'Lang']);
		expect(openContentCount()).toBe(1);
		expect(logs).toEqual([]);
	});

	it('Escape closes without adding', async () => {
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		type('NewDeck');
		await tick();
		pressKey('Escape');
		await tick();
		await tick();

		expect(chips('.desktop-row')).toEqual(['Math', 'Lang']);
		expect(openContentCount()).toBe(0);
		expect(logs).toEqual([]);
	});

	it('focus-outside closes without adding', async () => {
		mountHarness([makeCard('a', ['Math', 'Lang'])], ['Math', 'Lang', 'Spanish']);
		await tick();
		openPicker('Add deck to a.md');
		await tick();
		await tick();

		type('NewDeck');
		await tick();
		// Simulate focus leaving the overlay: the dismissible layer tracks focus-inside
		// via a blur-capture listener, so blur the input, then focus an element outside.
		inputEl().dispatchEvent(new FocusEvent('blur', { bubbles: false }));
		document.body.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await tick();
		await tick();

		expect(chips('.desktop-row')).toEqual(['Math', 'Lang']);
		expect(openContentCount()).toBe(0);
		expect(logs).toEqual([]);
	});

	it('each row edits independently with no shared draft', async () => {
		mountHarness(
			[makeCard('a', ['Math', 'Lang']), makeCard('b', ['Spanish'])],
			['Math', 'Lang', 'Spanish'],
		);
		await tick();

		openPicker('Add deck to a.md');
		await tick();
		await tick();
		expect(openContentCount()).toBe(1);

		// Close A via its trigger toggle.
		openPicker('Add deck to a.md');
		await tick();
		await tick();
		expect(openContentCount()).toBe(0);

		// Open B and add "Math" to B only.
		openPicker('Add deck to b.md');
		await tick();
		await tick();
		expect(openContentCount()).toBe(1);

		const mathItem = Array.from(
			document.querySelectorAll<HTMLElement>('.ml-combobox__item'),
		).find((el) => el.textContent?.trim() === 'Math');
		expect(mathItem).toBeTruthy();
		mathItem!.dispatchEvent(
			new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }),
		);
		await tick();
		await tick();

		// The portal stays open after the toggle; A keeps its decks; B gains Math.
		expect(openContentCount()).toBe(1);
		expect(chips('.desktop-row')).toEqual(['Math', 'Lang', 'Spanish', 'Math']);
		expect(chips('.mobile-row')).toEqual(['Math', 'Lang', 'Spanish', 'Math']);
		expect(logs).toEqual([]);
	});
});
