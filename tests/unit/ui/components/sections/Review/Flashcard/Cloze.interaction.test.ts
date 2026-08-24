// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { CardType } from '@/schemas';
import Cloze from '@/ui/components/sections/Review/Flashcard/Content/Cloze/component.svelte';
vi.mock('@/ui/actions/markdown', () => ({
	renderMarkdown(node: HTMLElement, options: { content: string }) {
		const render = (nextOptions: { content: string }) => {
			node.innerHTML = nextOptions.content;
		};
		render(options);
		return {
			update: render,
			destroy: () => node.replaceChildren(),
		};
	},
}));

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

		const highlighted = target.querySelector<HTMLElement>('.ml-cloze-placeholder-active');
		expect(highlighted).toBeTruthy();
		highlighted?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();

		expect(target.querySelector('.ml-cloze-text')?.textContent).toContain('Paris');
		expect(onAllRevealed).toHaveBeenCalledOnce();
		expect(onShowAnswer).toHaveBeenCalledOnce();
	});

	it('opens and closes the current deletion hint through pointer and keyboard controls', async () => {
		mountCloze();
		await tick();

		const hintButton = target.querySelector<HTMLButtonElement>('button.ml-cloze-hint__button');
		if (!hintButton) throw new Error('Cloze hint button not found');
		expect(hintButton.tagName).toBe('BUTTON');
		expect(hintButton.tabIndex).toBe(-1);
		expect(hintButton.getAttribute('aria-expanded')).toBe('false');
		expect(hintButton.getAttribute('aria-keyshortcuts')).toBe('H');
		expect(hintButton.textContent).toContain('Show hint');

		hintButton.focus();
		expect(activeDocument.activeElement).not.toBe(hintButton);

		hintButton.click();
		await tick();
		await tick();
		expect(activeDocument.body.textContent).toContain('City of Light');
		expect(target.querySelector('.ml-cloze-hint__body')).not.toBeNull();
		expect(hintButton.getAttribute('aria-expanded')).toBe('true');
		expect(hintButton.textContent).toContain('Hide hint');

		hintButton.click();
		await tick();
		expect(target.querySelector('.ml-cloze-hint')).toBeNull();
		expect(hintButton.getAttribute('aria-expanded')).toBe('false');

		const clozeContainer = target.querySelector<HTMLElement>('.ml-cloze-content');
		if (!clozeContainer) throw new Error('Cloze container not found');
		Object.defineProperty(clozeContainer, 'offsetParent', {
			configurable: true,
			value: document.body,
		});

		const showEvent = new KeyboardEvent('keydown', { key: 'h', bubbles: true, cancelable: true });
		window.dispatchEvent(showEvent);
		await tick();
		await tick();
		expect(showEvent.defaultPrevented).toBe(true);
		expect(target.querySelector('.ml-cloze-hint')).not.toBeNull();
		expect(hintButton.getAttribute('aria-expanded')).toBe('true');

		const hideEvent = new KeyboardEvent('keydown', { key: 'h', bubbles: true, cancelable: true });
		window.dispatchEvent(hideEvent);
		await tick();
		expect(hideEvent.defaultPrevented).toBe(true);
		expect(target.querySelector('.ml-cloze-hint')).toBeNull();
		expect(hintButton.getAttribute('aria-expanded')).toBe('false');

		const input = activeDocument.createElement('input');
		target.append(input);
		const inputEvent = new KeyboardEvent('keydown', { key: 'h', bubbles: true, cancelable: true });
		input.dispatchEvent(inputEvent);
		await tick();
		expect(inputEvent.defaultPrevented).toBe(false);
		expect(target.querySelector('.ml-cloze-hint')).toBeNull();
	});
});
