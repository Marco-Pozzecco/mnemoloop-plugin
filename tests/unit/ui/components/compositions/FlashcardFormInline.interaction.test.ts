// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { CardStatus, CardType, type Flashcard } from '@/schemas';
import FlashcardFormHarness from '../../../../helpers/FlashcardFormHarness.svelte';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../helpers/reset-singletons';

const BASIC_CARD = {
	uuid: '00000000-0000-4000-8000-0000000000aa',
	source: '[[notes/biology.md]]',
	status: CardStatus.ACTIVE,
	decks: ['Biology'],
	due: 0,
	card_type: CardType.Basic,
	content: { meta_type: CardType.Basic, front: 'Existing question', back: 'Existing answer' },
} as unknown as Flashcard;

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 0));
	await tick();
}

describe('sidebar flashcard form', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;
	let app: App;
	let onSave: ReturnType<typeof vi.fn>;
	let onClose: ReturnType<typeof vi.fn>;

	function mountForm(
		props: {
			mode: 'create' | 'edit';
			card?: Flashcard;
			prefillSource?: string;
		} = { mode: 'create' },
	): void {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(FlashcardFormHarness, {
			target,
			props: {
				app,
				deckOptions: ['Biology', 'Science'],
				onSave,
				onClose,
				...props,
			},
		});
	}

	function buttonByText(label: string): HTMLButtonElement {
		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!button) throw new Error(`No button labeled "${label}"`);
		return button;
	}

	function fillBasicForm(front: string, back: string): void {
		const areas = Array.from(target.querySelectorAll<HTMLTextAreaElement>('textarea'));
		const set = (element: HTMLTextAreaElement | undefined, value: string): void => {
			if (!element) throw new Error('Expected a Basic form textarea');
			element.value = value;
			element.dispatchEvent(new Event('change', { bubbles: true }));
		};
		set(areas[0], front);
		set(areas[1], back);
	}

	beforeEach(() => {
		resetSingletons();
		app = createMockPlugin([]).app as unknown as App;
		onSave = vi.fn().mockResolvedValue(true);
		onClose = vi.fn();
	});

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('uses the Manage title copy and submits a create payload with the pre-filled source', async () => {
		mountForm({ mode: 'create', prefillSource: '[[notes/biology.md]]' });
		await flush();

		expect(target.textContent).toContain('New flashcard');
		const sourceInput = Array.from(target.querySelectorAll<HTMLInputElement>('input')).find(
			(input) => input.value === '[[notes/biology.md]]',
		);
		expect(sourceInput, 'the Source field is pre-filled').toBeDefined();

		fillBasicForm('New question', 'New answer');
		await flush();
		buttonByText('Create').click();
		await flush();

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave.mock.calls[0]![0]).toMatchObject({
			content: { front: 'New question', back: 'New answer' },
			source: '[[notes/biology.md]]',
			decks: [],
		});
		expect(onSave.mock.calls[0]![0].status).toBeUndefined();
	});

	it('submits an edit payload with the seed values and status', async () => {
		mountForm({ mode: 'edit', card: BASIC_CARD });
		await flush();

		expect(target.textContent).toContain('Edit flashcard');
		const areas = Array.from(target.querySelectorAll<HTMLTextAreaElement>('textarea'));
		expect(areas.map((area) => area.value)).toEqual(['Existing question', 'Existing answer']);

		fillBasicForm('Updated question', 'Updated answer');
		await flush();
		buttonByText('Save').click();
		await flush();

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave.mock.calls[0]![0]).toMatchObject({
			content: { front: 'Updated question', back: 'Updated answer' },
			decks: ['Biology'],
			source: '[[notes/biology.md]]',
			status: CardStatus.ACTIVE,
		});
	});

	it('reports a validation error, keeps the form open, and does not save', async () => {
		mountForm({ mode: 'create' });
		await flush();

		buttonByText('Create').click();
		await flush();

		expect(target.textContent).toContain('Front is required.');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(onSave).not.toHaveBeenCalled();
	});

	it('keeps a create form open when the write fails', async () => {
		onSave.mockResolvedValue(false);
		mountForm({ mode: 'create' });
		await flush();

		fillBasicForm('Question', 'Answer');
		await flush();
		buttonByText('Create').click();
		await flush();

		expect(target.textContent).toContain('Couldn’t create the card');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(buttonByText('Create').disabled).toBe(false);
	});

	it('keeps an edit form open when the write fails', async () => {
		onSave.mockResolvedValue(false);
		mountForm({ mode: 'edit', card: BASIC_CARD });
		await flush();

		buttonByText('Save').click();
		await flush();

		expect(target.textContent).toContain('Couldn’t save the card');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
	});

	it('cancels without writing', async () => {
		mountForm({ mode: 'create' });
		await flush();

		buttonByText('Cancel').click();
		await flush();

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSave).not.toHaveBeenCalled();
	});
});
