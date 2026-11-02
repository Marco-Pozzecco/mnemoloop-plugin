// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { CardStatus, CardType } from '@/schemas';
import SidebarFlashcardCard from '@/ui/components/views/Sidebar/Flashcard/Card/component.svelte';
import { createFlashcardMetadata } from '../../../../../../helpers/factories';

function makeCard(overrides: Parameters<typeof createFlashcardMetadata>[0] = {}) {
	return createFlashcardMetadata({
		uuid: '00000000-0000-4000-8000-0000000000a1',
		file: 'cards/biology.md',
		source: '[[notes/biology.md]]',
		status: CardStatus.ACTIVE,
		card_type: CardType.Cloze,
		decks: ['Biology'],
		due: '2026-01-05T00:00:00.000Z',
		...overrides,
	});
}

describe('SidebarFlashcardCard', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('renders the type, due date, preview, and folded deck chips', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(SidebarFlashcardCard, {
			target,
			props: {
				card: makeCard({ decks: ['Biology', 'Cell Biology', 'Microbiology'] }),
				preview: 'The mitochondria is the powerhouse of the cell.',
				className: 'ml-test-card',
			},
		});
		await tick();

		const root = target.querySelector<HTMLElement>('.ml-sidabar-flashcard');
		expect(root).not.toBeNull();
		expect(root?.classList.contains('ml-test-card')).toBe(true);
		expect(root?.querySelector('.ml-sidabar-flashcard__meta .ml-badge')?.textContent?.trim()).toBe(
			'Cloze',
		);
		expect(root?.querySelector('.ml-sidabar-flashcard__due')?.textContent).toBe('Due: 2026-01-05');
		expect(root?.querySelector('.ml-sidabar-flashcard__preview')?.textContent).toBe(
			'The mitochondria is the powerhouse of the cell.',
		);

		const chips = Array.from(root?.querySelectorAll('.ml-chip') ?? []).map((chip) =>
			chip.textContent?.trim(),
		);
		expect(chips).toEqual(['Biology', 'Cell Biology', '+1']);
		expect(root?.textContent).toContain('also in Microbiology');
	});

	it('states when the card has no decks', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(SidebarFlashcardCard, {
			target,
			props: { card: makeCard({ decks: [] }), preview: 'Preview' },
		});
		await tick();

		expect(target.querySelector('.ml-deck-chips__empty')?.textContent).toBe('No decks');
	});
});
