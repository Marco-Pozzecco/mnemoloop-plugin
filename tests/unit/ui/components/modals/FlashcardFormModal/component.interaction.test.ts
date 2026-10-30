// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills';
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
import type { ModalController } from '@/ui/controllers/ModalController';
import { ModalViewEnum, modalStore } from '@/ui/store/modal.store';
import FlashcardFormModalHarness from '../../../../../helpers/FlashcardFormModalHarness.svelte';
import { createMockPlugin } from '../../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../../helpers/reset-singletons';

const OCCLUSION_CARD = {
	uuid: '00000000-0000-4000-8000-0000000000bb',
	source: null,
	status: CardStatus.ACTIVE,
	decks: [],
	card_type: CardType.Occlusion,
	content: {
		meta_type: CardType.Occlusion,
		image: 'attachments/lungs.png',
		width: 1024,
		height: 768,
		masks: [{ id: 'm1', rect: [0.2, 0.3, 0.4, 0.2], answer: 'Left upper lobe', hint: null }],
	},
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

describe('FlashcardFormModal interaction', () => {
	let target: HTMLDivElement;
	let unmountModal: (() => Promise<void>) | undefined;
	let controller: ModalController & { onClose: ReturnType<typeof vi.fn> };
	let publish: ReturnType<typeof createPublishSpy>;
	let app: App;

	function openModal(data: { mode: 'create' | 'edit'; card?: Flashcard }): void {
		modalStore.open(ModalViewEnum.flashcard, data);
	}

	function mountModal(): void {
		const plugin = createMockPlugin(
			[{ path: 'attachments/lungs.png', content: '' }],
			{
				linkTargets: {
					'lungs.png': 'attachments/lungs.png',
					'attachments/lungs.png': 'attachments/lungs.png',
				},
			},
		);
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		app = plugin.app as unknown as App;
		controller = {
			store: modalStore,
			onClose: vi.fn(),
		} as unknown as ModalController & { onClose: ReturnType<typeof vi.fn> };
		const instance = mount(FlashcardFormModalHarness, {
			target,
			props: { app: plugin.app as unknown as App, controller },
		});
		unmountModal = () => unmount(instance);
	}

	function buttonByText(label: string): HTMLButtonElement {
		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!button) throw new Error(`No button labeled "${label}"`);
		return button;
	}

	function tabTrigger(label: string): HTMLButtonElement {
		const trigger = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!trigger) throw new Error(`No tab trigger named ${label}`);
		return trigger;
	}

	/** Fills the Basic form's Front and Back textareas and commits the change. */
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

	/** Submits a valid Basic card and resolves the create with a written filepath. */
	async function createBasicCard(filepath: string, success = true): Promise<void> {
		fillBasicForm('Front question', 'Back answer');
		await tick();
		buttonByText('Save').click();
		await flush();

		const request = publish.mock.calls
			.map(([event]) => event as unknown)
			.find((event): event is FlashcardWriterCreateRequestEvent =>
				event instanceof FlashcardWriterCreateRequestEvent,
			);
		if (!request) throw new Error('No create request was published');

		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({ filepath, success, requestId: request.id }),
		);
		await flush();
	}

	beforeEach(() => {
		resetSingletons();
		modalStore.close();
		publish = createPublishSpy();
	});

	afterEach(async () => {
		await unmountModal?.();
		unmountModal = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('offers Occlusion as a selectable card type in create mode', async () => {
		openModal({ mode: 'create' });
		mountModal();
		await flush();

		const occlusionTab = tabTrigger('Occlusion');
		expect(occlusionTab.disabled).toBe(false);

		occlusionTab.click();
		await flush();

		expect(target.querySelector('.ml-occlusion-form__surface')).not.toBeNull();
		expect(tabTrigger('Occlusion').getAttribute('aria-selected')).toBe('true');
	});

	it('shows the validation error and publishes no writer event when an occlusion card is incomplete', async () => {
		openModal({ mode: 'create' });
		mountModal();
		await flush();

		tabTrigger('Occlusion').click();
		await flush();

		buttonByText('Save').click();
		await flush();

		expect(target.textContent).toContain('An image is required.');
		expect(
			publish.mock.calls.filter((call) => call[0] instanceof FlashcardWriterCreateRequestEvent),
		).toHaveLength(0);
		expect(controller.onClose).not.toHaveBeenCalled();
	});

	it('locks the card type selector to the existing type in edit mode', async () => {
		openModal({ mode: 'edit', card: OCCLUSION_CARD });
		mountModal();
		await flush();

		const occlusionTab = tabTrigger('Occlusion');
		expect(occlusionTab.getAttribute('aria-selected')).toBe('true');
		expect(occlusionTab.disabled || occlusionTab.hasAttribute('data-disabled')).toBe(true);

		const surface = target.querySelector('.ml-occlusion-form__surface');
		expect(surface).not.toBeNull();
		expect(target.querySelectorAll('.ml-occlusion-form__mask')).toHaveLength(1);
	});

	it('opens the created card and closes the modal', async () => {
		openModal({ mode: 'create' });
		mountModal();
		await flush();

		await createBasicCard('flashcards/new.md');

		expect(app.workspace.openLinkText).toHaveBeenCalledWith('flashcards/new.md', '', false);
		expect(controller.onClose).toHaveBeenCalledTimes(1);
	});

	it('stays open with the error when the create write fails', async () => {
		openModal({ mode: 'create' });
		mountModal();
		await flush();

		await createBasicCard('flashcards/new.md', false);

		expect(target.textContent).toContain('Could not save the flashcard');
		expect(controller.onClose).not.toHaveBeenCalled();
		expect(app.workspace.openLinkText).not.toHaveBeenCalled();
	});

	it('saves an edit through the form, opens the card and closes', async () => {
		const card = {
			...OCCLUSION_CARD,
			card_type: CardType.Basic,
			content: { meta_type: CardType.Basic, front: 'Old front', back: 'Old back' },
		} as unknown as Flashcard;
		openModal({ mode: 'edit', card });
		mountModal();
		await flush();

		fillBasicForm('New front', 'New back');
		await flush();
		buttonByText('Save').click();
		await flush();

		const request = publish.mock.calls
			.map(([event]) => event as unknown)
			.find((event): event is FlashcardWriterUpdateRequestEvent =>
				event instanceof FlashcardWriterUpdateRequestEvent,
			);
		expect(request).toBeDefined();
		expect(request!.data.uuid).toBe(card.uuid);

		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: 'flashcards/existing.md',
				success: true,
				requestId: request!.id,
			}),
		);
		await flush();

		expect(app.workspace.openLinkText).toHaveBeenCalledWith(
			'flashcards/existing.md',
			'',
			false,
		);
		expect(controller.onClose).toHaveBeenCalledTimes(1);
	});
});
