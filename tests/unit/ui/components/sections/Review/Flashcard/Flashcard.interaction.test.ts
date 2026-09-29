// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { CardStatus, CardType, type Flashcard } from '@/schemas';
import type { IReviewItem } from '@/interfaces/IReviewItem';
// Evaluate the UI barrel before the component under test; see
// ScoreControls.interaction.test.ts for the import-order cycle this avoids.
import '@/ui/components';
import FlashcardHarness from '../../../../../../helpers/FlashcardHarness.svelte';
import { createMockPlugin } from '../../../../../../helpers/mock-obsidian';

const OCCLUSION_CARD = {
	uuid: '00000000-0000-4000-8000-0000000000aa',
	source: null,
	status: CardStatus.ACTIVE,
	decks: [],
	card_type: CardType.Occlusion,
	content: {
		meta_type: CardType.Occlusion,
		image: 'lungs.png',
		width: 1000,
		height: 800,
		masks: [
			{ id: 'm1', rect: [0.1, 0.1, 0.2, 0.2], answer: 'Left upper lobe', hint: null },
			{ id: 'm2', rect: [0.5, 0.5, 0.2, 0.2], answer: 'Right lower lobe', hint: null },
		],
	},
} as unknown as Flashcard;

function createItem(card: Flashcard): IReviewItem<Flashcard> {
	return {
		data: card,
		id: 'item-1',
		filepath: 'cards/occlusion.md',
		review: vi.fn(),
		restore: vi.fn(),
		dispose: vi.fn(),
	};
}

describe('Flashcard interaction', () => {
	let target: HTMLDivElement;
	let unmountFlashcard: (() => Promise<void>) | undefined;

	function mountFlashcard(item: IReviewItem<Flashcard>) {
		const app = createMockPlugin([], { linkTargets: { 'lungs.png': 'attachments/lungs.png' } });
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const instance = mount(FlashcardHarness, {
			target,
			props: { app: app.app as unknown as App, item },
		});
		unmountFlashcard = () => unmount(instance);
	}

	afterEach(async () => {
		await unmountFlashcard?.();
		unmountFlashcard = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('starts a freshly mounted occlusion card unrevealed with the shared answer control unavailable', async () => {
		mountFlashcard(createItem(OCCLUSION_CARD));
		await tick();
		await tick();

		expect(target.querySelector('.ml-occlusion-image')).not.toBeNull();
		expect(target.querySelector('.ml-occlusion-mask--revealed')).toBeNull();

		const showAnswer = target.querySelector<HTMLButtonElement>('button[aria-label="Show answer"]');
		expect(showAnswer).not.toBeNull();
		expect(showAnswer?.disabled).toBe(true);
	});
});
