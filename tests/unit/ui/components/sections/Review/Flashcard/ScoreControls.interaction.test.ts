// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { Platform } from 'obsidian';
import { CardType } from '@/schemas';
import ScoreControls from '@/ui/components/sections/Review/Flashcard/ScoreControls/component.svelte';

describe('ScoreControls interaction', () => {
	let target: HTMLDivElement;
	let unmountScoreControls: (() => void) | undefined;
	let initialIsMobile: boolean;

	function mountScoreControls(isMobile: boolean) {
		Platform.isMobile = isMobile;
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);

		const onShowAnswer = vi.fn();
		const instance = mount(ScoreControls, {
			target,
			props: {
				type: CardType.Basic,
				isAnswerShowing: false,
				isAnswerCorrect: false,
				onShowAnswer,
				onSubmitRating: vi.fn(),
			},
		});
		unmountScoreControls = () => unmount(instance);

		return { onShowAnswer };
	}

	beforeEach(() => {
		initialIsMobile = Platform.isMobile;
	});

	afterEach(() => {
		unmountScoreControls?.();
		unmountScoreControls = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
		Platform.isMobile = initialIsMobile;
	});

	it('shows Tap on mobile and invokes onShowAnswer once when clicked', async () => {
		const { onShowAnswer } = mountScoreControls(true);
		await tick();

		const hint = target.querySelector('.ml-score-controls__button-key-hint');
		expect(hint?.textContent).toBe('Tap');
		expect(hint?.textContent).not.toContain('Space');

		const showAnswerButton = target.querySelector<HTMLButtonElement>('button[aria-label="Show answer"]');
		expect(showAnswerButton).not.toBeNull();
		showAnswerButton?.click();

		expect(onShowAnswer).toHaveBeenCalledTimes(1);
	});

	it('shows Space on desktop', async () => {
		mountScoreControls(false);
		await tick();

		const hint = target.querySelector('.ml-score-controls__button-key-hint');
		expect(hint?.textContent).toBe('Space');
	});
});
