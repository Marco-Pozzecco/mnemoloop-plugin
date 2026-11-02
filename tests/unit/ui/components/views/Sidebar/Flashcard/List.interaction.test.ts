// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { FlashcardMetadata } from '@/schemas';
import SidebarFlashcardList from '@/ui/components/views/Sidebar/Flashcard/List/component.svelte';
import { createFlashcardMetadata } from '../../../../../../helpers/factories';

function makeCard(uuid: string, file: string): FlashcardMetadata {
	return createFlashcardMetadata({
		uuid,
		file,
		source: '[[notes/biology.md]]',
	});
}

function hrefFor(card: FlashcardMetadata): string {
	return `obsidian://open?vault=vault&file=${encodeURIComponent(card.file)}`;
}

describe('SidebarFlashcardList', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	function mountList(cards: FlashcardMetadata[], onOpen = vi.fn()) {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(SidebarFlashcardList, {
			target,
			props: {
				cards,
				previews: {
					'cards/a.md': 'Preview A',
					'cards/b.md': 'Preview B',
				},
				hrefFor,
				onOpen,
				className: 'ml-test-list',
			},
		});
		return onOpen;
	}

	it('renders one vault-link anchor per card and passes its preview through', async () => {
		const cards = [makeCard('a', 'cards/a.md'), makeCard('b', 'cards/b.md')];
		mountList(cards);
		await tick();

		const list = target.querySelector<HTMLElement>('.ml-sidabar-flashcard__list');
		expect(list).not.toBeNull();
		expect(list?.classList.contains('ml-test-list')).toBe(true);

		const wrappers = Array.from(
			target.querySelectorAll<HTMLAnchorElement>('.ml-sidabar-flashcard__wrapper'),
		);
		expect(wrappers).toHaveLength(2);
		expect(wrappers[0].getAttribute('href')).toBe('obsidian://open?vault=vault&file=cards%2Fa.md');
		expect(wrappers[1].getAttribute('href')).toBe('obsidian://open?vault=vault&file=cards%2Fb.md');
		expect(wrappers[0].querySelector('.ml-sidabar-flashcard__preview')?.textContent).toBe(
			'Preview A',
		);
		expect(wrappers[1].querySelector('.ml-sidabar-flashcard__preview')?.textContent).toBe(
			'Preview B',
		);
	});

	it('opens a card on a plain click and leaves modifier-clicks to the vault link', async () => {
		const cards = [makeCard('a', 'cards/a.md'), makeCard('b', 'cards/b.md')];
		const onOpen = mountList(cards);
		await tick();

		const wrappers = target.querySelectorAll<HTMLAnchorElement>('.ml-sidabar-flashcard__wrapper');
		const plainClick = new MouseEvent('click', { bubbles: true, cancelable: true });
		wrappers[1].dispatchEvent(plainClick);

		expect(plainClick.defaultPrevented).toBe(true);
		expect(onOpen).toHaveBeenCalledWith(cards[1]);

		onOpen.mockClear();
		// Modifier-clicks fall through to the browser; keep jsdom on the page.
		wrappers[0].setAttribute('href', '#');
		const modifierClick = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			metaKey: true,
		});
		wrappers[0].dispatchEvent(modifierClick);

		expect(onOpen).not.toHaveBeenCalled();
		expect(modifierClick.defaultPrevented).toBe(false);
	});

	it('renders an empty list when there are no cards', async () => {
		mountList([]);
		await tick();

		expect(target.querySelectorAll('.ml-sidabar-flashcard__wrapper')).toHaveLength(0);
	});
});
