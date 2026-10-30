// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills'; // MUST be the first import (side-effect polyfills)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import DeckPickerHarness from '../../../../helpers/DeckPickerHarness.svelte';

function tick(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

function addButton(): HTMLButtonElement {
	const button = activeDocument.querySelector<HTMLButtonElement>('button[aria-label="Add deck"]');
	if (!button) throw new Error('add deck trigger not found');
	return button;
}

function openPicker(): void {
	// bits-ui's trigger toggles on pointerdown (click only focuses the button).
	addButton().dispatchEvent(
		new PointerEvent('pointerdown', {
			bubbles: true,
			button: 0,
			pointerType: 'mouse',
			cancelable: true,
		}),
	);
}

function inputEl(): HTMLInputElement {
	const input = activeDocument.querySelector<HTMLInputElement>('input.ml-combobox__input');
	if (!input) throw new Error('combobox input not found');
	return input;
}

function type(text: string): void {
	const input = inputEl();
	input.value = text;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressKey(key: string): void {
	inputEl().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function openContentCount(): number {
	return activeDocument.querySelectorAll('.ml-combobox__content').length;
}

function chipLabels(): string[] {
	return Array.from(
		activeDocument.querySelectorAll<HTMLElement>('.ml-deck-picker__row .ml-chip'),
	).map((el) => el.textContent?.trim() ?? '');
}

function selectedItemLabels(): string[] {
	return Array.from(
		activeDocument.querySelectorAll<HTMLElement>(
			'.ml-combobox__item[data-selected] .ml-combobox__item-label',
		),
	).map((el) => el.textContent?.trim() ?? '');
}

describe('DeckPicker interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	beforeEach(() => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
	});

	afterEach(() => {
		if (instance) unmount(instance);
		target.remove();
		activeDocument.body.innerHTML = '';
	});

	function mountPicker(initialDecks: string[], deckOptions: string[]) {
		const onAdd = vi.fn();
		const onRemove = vi.fn();
		instance = mount(DeckPickerHarness, {
			target,
			props: { initialDecks, deckOptions, onAdd, onRemove },
		});
		return { onAdd, onRemove };
	}

	it('shows the card decks as removable chips', () => {
		mountPicker(['Math', 'Lang'], ['Math', 'Lang', 'Spanish']);
		expect(chipLabels()).toEqual(['Math', 'Lang']);
		expect(activeDocument.querySelector('button[aria-label="Remove Math"]')).toBeTruthy();
	});

	it('opens the picker with the existing decks selected and adds on click', async () => {
		const { onAdd } = mountPicker(['Math', 'Lang'], ['Math', 'Lang', 'Spanish']);
		await tick();
		openPicker();
		await tick();

		expect(openContentCount()).toBe(1);
		expect(selectedItemLabels()).toEqual(['Math', 'Lang']);

		const spanish = Array.from(
			activeDocument.querySelectorAll<HTMLElement>('.ml-combobox__item'),
		).find((item) => item.textContent?.includes('Spanish'));
		spanish?.dispatchEvent(
			new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }),
		);
		await tick();
		await tick();

		expect(onAdd).toHaveBeenCalledWith('Spanish');
		expect(chipLabels()).toEqual(['Math', 'Lang', 'Spanish']);
		expect(openContentCount()).toBe(1);
	});

	it('removes a deck when its chip remove control is activated', async () => {
		const { onRemove } = mountPicker(['Math', 'Lang'], ['Math', 'Lang']);
		activeDocument.querySelector<HTMLButtonElement>('button[aria-label="Remove Math"]')?.click();
		await tick();

		expect(onRemove).toHaveBeenCalledWith('Math');
		expect(chipLabels()).toEqual(['Lang']);
	});

	it('creates a new deck on Enter and closes the picker', async () => {
		const { onAdd } = mountPicker(['Math'], ['Math']);
		await tick();
		openPicker();
		await tick();

		type('NewDeck');
		await tick();
		pressKey('Enter');
		await tick();

		expect(onAdd).toHaveBeenCalledWith('NewDeck');
		expect(chipLabels()).toEqual(['Math', 'NewDeck']);
		expect(openContentCount()).toBe(0);
	});

	it('closes on Escape without adding', async () => {
		const { onAdd } = mountPicker(['Math'], ['Math', 'Spanish']);
		await tick();
		openPicker();
		await tick();

		type('Span');
		pressKey('Escape');
		await tick();

		expect(onAdd).not.toHaveBeenCalled();
		expect(openContentCount()).toBe(0);
		expect(chipLabels()).toEqual(['Math']);
	});
});
