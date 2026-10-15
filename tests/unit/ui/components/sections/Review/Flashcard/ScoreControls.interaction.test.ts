// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { Platform } from 'obsidian';
import { CardType } from '@/schemas';
// Evaluate the UI barrel before the component under test. sections/index.ts
// re-exports Review/Flashcard, which imports ScoreControls, so mounting the
// manual controls first hits an import cycle that leaves the barrel's Button
// binding undefined under the SSR-transformed test environment.
import '@/ui/components';
import ScoreControls from '@/ui/components/sections/Review/Flashcard/ScoreControls/component.svelte';

describe('ScoreControls interaction', () => {
	let target: HTMLDivElement;
	let unmountScoreControls: (() => Promise<void>) | undefined;
	let initialIsMobile: boolean;

	function mountScoreControls(
		isMobile: boolean,
		type: CardType = CardType.Basic,
		isAnswerShowing = false,
		isAnswerCorrect = false,
	) {
		Platform.isMobile = isMobile;
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);

		const onShowAnswer = vi.fn();
		const instance = mount(ScoreControls, {
			target,
			props: {
				type,
				isAnswerShowing,
				isAnswerCorrect,
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

	afterEach(async () => {
		await unmountScoreControls?.();
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

	it('shows the auto controls, not the manual ratings, for an occlusion card', async () => {
		mountScoreControls(false, CardType.Occlusion, true, true);
		await tick();

		expect(target.querySelector('.ml-score-controls--auto')).not.toBeNull();
		expect(target.querySelector('.ml-score-controls__alert-label')?.textContent).toBe('Correct');
		expect(target.querySelector('.ml-score-controls--manual')).toBeNull();
		expect(target.querySelector('button[aria-label="Rate as Again"]')).toBeNull();
		expect(target.querySelector('button[aria-label="Rate as Easy"]')).toBeNull();
	});
});
