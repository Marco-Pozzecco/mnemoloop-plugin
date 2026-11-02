// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { EventBus } from '@/modules/events/core';
import {
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard/writer';
import { CardStatus, CardType, type Flashcard } from '@/schemas';
import FlashcardFormHarness from '../../../../helpers/FlashcardFormHarness.svelte';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../helpers/reset-singletons';

const BASIC_CARD = {
	uuid: '00000000-0000-4000-8000-0000000000aa',
	source: '[[notes/biology.md]]',
	status: CardStatus.ACTIVE,
	decks: ['Biology'],
	card_type: CardType.Basic,
	content: { meta_type: CardType.Basic, front: 'Existing question', back: 'Existing answer' },
} as unknown as Flashcard;

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

function createPublishSpy() {
	return vi.spyOn(EventBus.instance, 'publish');
}

describe('FlashcardForm interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;
	let app: App;
	let onSaved: ReturnType<typeof vi.fn>;
	let onCancel: ReturnType<typeof vi.fn>;
	let publish: ReturnType<typeof createPublishSpy>;

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
			props: { app, onSaved, onCancel, ...props },
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

	function published<T>(eventClass: abstract new (...args: never[]) => T): T | undefined {
		return publish.mock.calls
			.map(([event]) => event as unknown)
			.find((event): event is T => event instanceof eventClass);
	}

	beforeEach(() => {
		resetSingletons();
		app = createMockPlugin([]).app as unknown as App;
		onSaved = vi.fn();
		onCancel = vi.fn();
		publish = createPublishSpy();
	});

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('submits a create with the pre-filled source and reports the saved filepath', async () => {
		mountForm({ mode: 'create', prefillSource: '[[notes/biology.md]]' });
		await flush();

		const sourceInput = Array.from(target.querySelectorAll<HTMLInputElement>('input')).find(
			(input) => input.value === '[[notes/biology.md]]',
		);
		expect(sourceInput, 'the Source field is pre-filled').toBeDefined();

		fillBasicForm('New question', 'New answer');
		await flush();
		buttonByText('Create').click();
		await flush();

		const request = published(FlashcardWriterCreateRequestEvent);
		expect(request).toBeDefined();
		expect(request!.data.source).toBe('[[notes/biology.md]]');
		expect(request!.data.content).toMatchObject({ front: 'New question', back: 'New answer' });

		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({
				filepath: 'flashcards/new.md',
				success: true,
				requestId: request!.id,
			}),
		);
		await flush();

		expect(onSaved).toHaveBeenCalledWith('flashcards/new.md');
	});

	it('submits an edit with the card uuid and reports the saved filepath', async () => {
		mountForm({ mode: 'edit', card: BASIC_CARD });
		await flush();

		const areas = Array.from(target.querySelectorAll<HTMLTextAreaElement>('textarea'));
		expect(areas.map((area) => area.value)).toEqual(['Existing question', 'Existing answer']);

		fillBasicForm('Updated question', 'Updated answer');
		await flush();
		buttonByText('Save').click();
		await flush();

		const request = published(FlashcardWriterUpdateRequestEvent);
		expect(request).toBeDefined();
		expect(request!.data.uuid).toBe(BASIC_CARD.uuid);
		expect(request!.data.content).toMatchObject({ front: 'Updated question', back: 'Updated answer' });

		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: 'flashcards/existing.md',
				success: true,
				requestId: request!.id,
			}),
		);
		await flush();

		expect(onSaved).toHaveBeenCalledWith('flashcards/existing.md');
	});

	it('reports a validation error, keeps the form open, and publishes nothing', async () => {
		mountForm({ mode: 'create' });
		await flush();

		buttonByText('Create').click();
		await flush();

		expect(target.textContent).toContain('Front is required.');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(published(FlashcardWriterCreateRequestEvent)).toBeUndefined();
		expect(onSaved).not.toHaveBeenCalled();
	});

	it('keeps a create form open when the write fails', async () => {
		mountForm({ mode: 'create' });
		await flush();

		fillBasicForm('Question', 'Answer');
		await flush();
		buttonByText('Create').click();
		await flush();

		const request = published(FlashcardWriterCreateRequestEvent)!;
		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({
				filepath: 'flashcards/new.md',
				success: false,
				requestId: request.id,
			}),
		);
		await flush();

		expect(target.textContent).toContain('Couldn’t save the card');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(buttonByText('Create').disabled).toBe(false);
		expect(onSaved).not.toHaveBeenCalled();
	});

	it('keeps an edit form open when the write fails', async () => {
		mountForm({ mode: 'edit', card: BASIC_CARD });
		await flush();

		buttonByText('Save').click();
		await flush();

		const request = published(FlashcardWriterUpdateRequestEvent)!;
		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: 'flashcards/existing.md',
				success: false,
				requestId: request.id,
			}),
		);
		await flush();

		expect(target.textContent).toContain('Couldn’t save the card');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(onSaved).not.toHaveBeenCalled();
	});

	it('cancels without writing', async () => {
		mountForm({ mode: 'create' });
		await flush();

		buttonByText('Cancel').click();
		await flush();

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(published(FlashcardWriterCreateRequestEvent)).toBeUndefined();
	});
});
