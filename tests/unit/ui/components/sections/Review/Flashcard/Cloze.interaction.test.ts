// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { CardType } from '@/schemas';
import Cloze from '@/ui/components/sections/Review/Flashcard/Content/Cloze/component.svelte';

const content = {
	meta_type: CardType.Cloze,
	text: 'The capital of  is France',
	deletions: [{ id: 'c1', answer: 'Paris', hint: 'City of Light', positions: [15] }],
};

describe('Cloze interaction', () => {
	let target: HTMLDivElement;
	let unmountCloze: (() => void) | undefined;

	function mountCloze() {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onAllRevealed = vi.fn();
		const onShowAnswer = vi.fn();
	const instance = mount(Cloze, {
		target,
		props: { content, isAnswerShowing: false, onAllRevealed, onShowAnswer },
	});
	unmountCloze = () => unmount(instance);
		return { onAllRevealed, onShowAnswer };
	}

	afterEach(() => {
	unmountCloze?.();
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('reveals the selected deletion and completes the card', async () => {
		const { onAllRevealed, onShowAnswer } = mountCloze();
		await tick();

		const highlighted = target.querySelector<HTMLElement>('.ml-cloze-highlighted');
		expect(highlighted).toBeTruthy();
		highlighted?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();

		expect(target.querySelector('.ml-cloze-revealed')?.textContent).toContain('Paris');
		expect(onAllRevealed).toHaveBeenCalledOnce();
		expect(onShowAnswer).toHaveBeenCalledOnce();
	});

	it('opens the current deletion hint', async () => {
		mountCloze();
		await tick();

		const hintButton = target.querySelector<HTMLButtonElement>('button.ml-cloze-hint__button');
		expect(hintButton).toBeTruthy();
		hintButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		await tick();

		expect(activeDocument.body.textContent).toContain('City of Light');
	});
});
