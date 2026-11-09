// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import ManageFlashcardFormSheet from '@/ui/components/sections/Manage/FlashcardFormSheet/component.svelte';
import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';

function tick(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
	return {
		uuid: '11111111-1111-4111-8111-111111111111',
		card_type: CardType.Basic,
		status: CardStatus.ACTIVE,
		decks: ['Math'],
		source: null,
		due: 0,
		content: { meta_type: CardType.Basic, front: 'Question', back: 'Answer' },
		...overrides,
	} as unknown as Flashcard;
}

function buttonByText(label: string): HTMLButtonElement {
	const button = Array.from(activeDocument.querySelectorAll<HTMLButtonElement>('button')).find(
		(el) => el.textContent?.trim() === label,
	);
	if (!button) throw new Error(`button not found: ${label}`);
	return button;
}

describe('FlashcardForm interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;

	function mountSheet(card = makeCard()) {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onClose = vi.fn();
		const onSave = vi.fn().mockResolvedValue(true);
		const onDelete = vi.fn();
		instance = mount(ManageFlashcardFormSheet, {
			target,
			props: {
				mode: 'edit',
				card,
				label: 'Question',
				deckOptions: ['Math', 'Science'],
				onClose,
				onSave,
				onDelete,
			},
		});
		return { onClose, onSave, onDelete };
	}

	function mountCreateSheet() {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onClose = vi.fn();
		const onSave = vi.fn().mockResolvedValue(true);
		instance = mount(ManageFlashcardFormSheet, {
			target,
			props: {
				mode: 'create',
				deckOptions: ['Math', 'Science'],
				onClose,
				onSave,
			},
		});
		return { onClose, onSave };
	}

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('renders a non-modal dialog with the card meta and editor', async () => {
		mountSheet();
		await tick();

		const sheet = activeDocument.querySelector<HTMLElement>('.ml-sheet');
		expect(sheet).toBeTruthy();
		expect(sheet?.getAttribute('role')).toBe('dialog');
		expect(sheet?.getAttribute('aria-modal')).toBe('false');
		expect(sheet?.getAttribute('aria-labelledby')).toBeTruthy();
		expect(sheet?.textContent).toContain('Edit flashcard');
		expect(sheet?.textContent).toContain('Basic');
		expect(sheet?.textContent).toContain('ACTIVE');
		const front = activeDocument.querySelector<HTMLTextAreaElement>('.ml-textarea');
		expect(front?.value).toBe('Question');
		expect(activeDocument.querySelectorAll('.ml-textarea').length).toBe(2);
		expect(activeDocument.querySelector('.ml-chip')?.textContent).toContain('Math');
	});

	it('closes on Escape', async () => {
		const { onClose } = mountSheet();
		await tick();

		activeDocument.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
		);
		await tick();

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('restores focus to the previously focused element on unmount', async () => {
		const trigger = activeDocument.createElement('button');
		activeDocument.body.appendChild(trigger);
		trigger.focus();
		expect(activeDocument.activeElement).toBe(trigger);

		mountSheet();
		await tick();
		expect(activeDocument.activeElement).not.toBe(trigger);

		if (instance) unmount(instance);
		instance = undefined;
		expect(activeDocument.activeElement).toBe(trigger);
	});

	it('saves one payload with content, decks, source, and status', async () => {
		const { onSave } = mountSheet();
		await tick();

		const front = activeDocument.querySelector<HTMLTextAreaElement>('.ml-textarea');
		if (!front) throw new Error('front textarea not found');
		front.value = 'Updated question';
		front.dispatchEvent(new Event('change', { bubbles: true }));
		await tick();

		buttonByText('Save').click();
		await tick();

		expect(onSave).toHaveBeenCalledTimes(1);
		const payload = onSave.mock.calls[0]![0];
		expect(payload.content).toEqual({
			meta_type: CardType.Basic,
			front: 'Updated question',
			back: 'Answer',
		});
		expect(payload.decks).toEqual(['Math']);
		expect(payload.source).toBeNull();
		expect(payload.status).toBe(CardStatus.ACTIVE);
	});

	it('removes a deck before saving', async () => {
		const { onSave } = mountSheet();
		await tick();

		activeDocument.querySelector<HTMLButtonElement>('button[aria-label="Remove Math"]')?.click();
		await tick();
		buttonByText('Save').click();
		await tick();

		expect(onSave.mock.calls[0]![0].decks).toEqual([]);
	});

	it('rejects an invalid source without saving', async () => {
		const { onSave } = mountSheet();
		await tick();

		const input = activeDocument.querySelector<HTMLInputElement>('#ml-flashcard-form-source');
		if (!input) throw new Error('source input not found');
		input.value = 'not-a-link';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await tick();

		buttonByText('Save').click();
		await tick();

		expect(onSave).not.toHaveBeenCalled();
		expect(activeDocument.querySelector('[role="alert"]')?.textContent).toContain('[[wikilink]]');
	});

	it('deletes only after the confirmation dialog is accepted', async () => {
		const { onDelete } = mountSheet();
		await tick();

		buttonByText('Delete').click();
		await tick();
		expect(onDelete).not.toHaveBeenCalled();

		activeDocument.querySelector<HTMLButtonElement>('.ml-alert-dialog__action')?.click();
		await tick();
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('renders the create sheet with a type chooser and no destructive action', async () => {
		mountCreateSheet();
		await tick();

		const sheet = activeDocument.querySelector<HTMLElement>('.ml-sheet');
		expect(sheet?.textContent).toContain('New flashcard');
		expect(activeDocument.querySelector('#ml-flashcard-form-type')).toBeTruthy();
		expect(activeDocument.querySelector('#ml-flashcard-form-status')).toBeNull();
		// The card-type select already states it; the header repeats nothing.
		expect(activeDocument.querySelector('.ml-sheet__meta')).toBeNull();
		expect(buttonByText('Create')).toBeTruthy();
		expect(
			Array.from(activeDocument.querySelectorAll('button')).some(
				(button) => button.textContent?.trim() === 'Delete',
			),
		).toBe(false);
	});

	it('creates with the editor content and no status', async () => {
		const { onSave } = mountCreateSheet();
		await tick();

		const textareas = activeDocument.querySelectorAll<HTMLTextAreaElement>('.ml-textarea');
		textareas[0].value = 'New front';
		textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
		textareas[1].value = 'New back';
		textareas[1].dispatchEvent(new Event('change', { bubbles: true }));
		await tick();

		buttonByText('Create').click();
		await tick();

		expect(onSave).toHaveBeenCalledTimes(1);
		const payload = onSave.mock.calls[0]![0];
		expect(payload.content).toEqual({
			meta_type: CardType.Basic,
			front: 'New front',
			back: 'New back',
		});
		expect(payload.decks).toEqual([]);
		expect(payload.source).toBeNull();
		expect(payload.status).toBeUndefined();
	});
});
