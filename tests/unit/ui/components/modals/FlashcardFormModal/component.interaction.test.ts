// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { EventBus } from '@/modules/events/core';
import { FlashcardWriterCreateRequestEvent } from '@/modules/events/domains/flashcard/writer';
import { CardStatus, CardType, type Flashcard } from '@/schemas';
import type { ModalController } from '@/ui/controllers/ModalController';
import { ModalViewEnum, modalStore } from '@/ui/store/modal.store';
import FlashcardFormModalHarness from '../../../../../helpers/FlashcardFormModalHarness.svelte';
import { createMockPlugin } from '../../../../../helpers/mock-obsidian';

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

function createPublishSpy() {
	return vi.spyOn(EventBus.instance, 'publish');
}

describe('FlashcardFormModal interaction', () => {
	let target: HTMLDivElement;
	let unmountModal: (() => Promise<void>) | undefined;
	let controller: ModalController & { confirmAction?: () => Promise<void> };
	let publish: ReturnType<typeof createPublishSpy>;

	function openModal(data: { mode: 'create' | 'edit'; card?: Flashcard }): void {
		modalStore.open(ModalViewEnum.flashcard, data);
		modalStore.setError(null);
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
		controller = {
			store: modalStore,
			onClose: vi.fn(),
			close: vi.fn(),
		} as unknown as ModalController & { confirmAction?: () => Promise<void> };
		const instance = mount(FlashcardFormModalHarness, {
			target,
			props: { app: plugin.app as unknown as App, controller },
		});
		unmountModal = () => unmount(instance);
	}

	function tabTrigger(label: string): HTMLButtonElement {
		const trigger = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!trigger) throw new Error(`No tab trigger named ${label}`);
		return trigger;
	}

	beforeEach(() => {
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
		await tick();

		const occlusionTab = tabTrigger('Occlusion');
		expect(occlusionTab.disabled).toBe(false);

		occlusionTab.click();
		await tick();

		expect(target.querySelector('.ml-occlusion-form__surface')).not.toBeNull();
		expect(tabTrigger('Occlusion').getAttribute('aria-selected')).toBe('true');
	});

	it('reports the validation error and publishes no writer event when an occlusion card is incomplete', async () => {
		openModal({ mode: 'create' });
		mountModal();
		await tick();

		tabTrigger('Occlusion').click();
		await tick();

		await controller.confirmAction?.();
		await tick();

		// The submit path reports the occlusion validation error on the modal store
		// and stops before any writer request. Rendering that error in the Banner is
		// owned by Modal.svelte and is not reactive today (see the change report).
		expect(modalStore.state.error).toBe('An image is required.');
		expect(
			publish.mock.calls.filter((call) => call[0] instanceof FlashcardWriterCreateRequestEvent),
		).toHaveLength(0);
	});

	it('locks the card type selector to the existing type in edit mode', async () => {
		openModal({ mode: 'edit', card: OCCLUSION_CARD });
		mountModal();
		await tick();

		const occlusionTab = tabTrigger('Occlusion');
		expect(occlusionTab.getAttribute('aria-selected')).toBe('true');
		expect(occlusionTab.disabled || occlusionTab.hasAttribute('data-disabled')).toBe(true);

		const surface = target.querySelector('.ml-occlusion-form__surface');
		expect(surface).not.toBeNull();
		expect(target.querySelectorAll('.ml-occlusion-form__mask')).toHaveLength(1);
	});
});
