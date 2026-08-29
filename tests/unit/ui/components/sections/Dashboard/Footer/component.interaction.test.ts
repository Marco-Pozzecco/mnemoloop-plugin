// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import { DEFAULT_STATISTICS } from '@/schemas';
import DashboardFooter from '@/ui/components/sections/Dashboard/Footer/component.svelte';

async function flush(): Promise<void> {
	await Promise.resolve();
}

describe('DashboardFooter priming action', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	function mountFooter(props: Record<string, unknown> = {}) {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(DashboardFooter, {
			target,
			props: {
				stats: DEFAULT_STATISTICS,
				onStartReview: vi.fn(),
				onStartPriming: vi.fn(),
				isPrimingDisabled: false,
				difficultyThreshold: 7,
				...props,
			},
		});
		return flush();
	}

	function findButton(text: string): HTMLButtonElement | null {
		const buttons = Array.from(target.querySelectorAll<HTMLButtonElement>('button'));
		for (const button of buttons) {
			if (button.textContent?.includes(text)) {
				return button;
			}
		}
		return null;
	}

	it('shows the priming action with All decks context and calls onStartPriming', async () => {
		const onStartPriming = vi.fn();
		await mountFooter({ onStartPriming });

		const priming = findButton('Prime difficult notes');
		expect(priming).not.toBeNull();
		expect(target.textContent).toContain('All decks · difficulty > 7.0');
		expect(priming?.disabled).toBe(false);

		priming?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(onStartPriming).toHaveBeenCalledTimes(1);
	});

	it('shows the selected deck and threshold context on the priming action', async () => {
		await mountFooter({
			difficultyThreshold: 7.5,
			selectedDeck: { name: 'Informatics', fullPath: 'Informatics', dueNow: 4, totalCards: 10 },
		});

		expect(target.textContent).toContain('Prime difficult notes');
		expect(target.textContent).toContain('Informatics · difficulty > 7.5');
	});

	it('disables priming only when the selected deck has no due cards', async () => {
		await mountFooter({
			isPrimingDisabled: true,
			selectedDeck: { name: 'Informatics', fullPath: 'Informatics', dueNow: 0, totalCards: 10 },
		});

		expect(findButton('Prime difficult notes')?.disabled).toBe(true);
	});

	it('keeps the normal review action independent from priming', async () => {
		const onStartReview = vi.fn();
		await mountFooter({
			onStartReview,
			isPrimingDisabled: true,
			stats: {
				...DEFAULT_STATISTICS,
				flashcard: { ...DEFAULT_STATISTICS.flashcard, due_now: 5 },
			},
		});

		const review = findButton('Start review session');
		expect(review).not.toBeNull();
		expect(review?.disabled).toBe(false);
	});
});
