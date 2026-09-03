// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import { DEFAULT_STATISTICS } from '@/schemas';
import DashboardFooter from '@/ui/components/sections/Dashboard/Footer/component.svelte';

async function flush(): Promise<void> {
	await Promise.resolve();
}

describe('DashboardFooter study actions', () => {
	let target: HTMLDivElement;
	let instance: Record<string, unknown> | undefined;

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
				reviewDueCount: 1,
				primingAvailability: 'available',
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

	it('renders the study-next card header with All decks and a ready review action', async () => {
		const onStartReview = vi.fn();
		await mountFooter({ onStartReview });

		const heading = target.querySelector<HTMLHeadingElement>(
			'#ml-dashboard-study-actions-title',
		);
		expect(heading?.textContent?.trim().toUpperCase()).toBe('STUDY NEXT');
		expect(target.textContent).toContain('All decks');

		const review = findButton('Review 1 due card');
		expect(review).not.toBeNull();
		expect(review?.disabled).toBe(false);
		review?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(onStartReview).toHaveBeenCalledTimes(1);
	});

	it('pluralizes the review label for multiple due cards and calls onStartReview', async () => {
		const onStartReview = vi.fn();
		await mountFooter({ onStartReview, reviewDueCount: 4 });

		const review = findButton('Review 4 due cards');
		expect(review).not.toBeNull();
		expect(review?.disabled).toBe(false);

		review?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(onStartReview).toHaveBeenCalledTimes(1);
	});

	it('shows the selected deck in the header and threshold on the priming action', async () => {
		const onStartPriming = vi.fn();
		await mountFooter({
			onStartPriming,
			difficultyThreshold: 7.5,
			selectedDeck: { name: 'Informatics', fullPath: 'Informatics', dueNow: 4, totalCards: 10 },
		});

		const header = target.querySelector<HTMLElement>('.ml-dashboard__study-actions__header');
		expect(header?.textContent).toContain('Informatics');
		expect(target.textContent).toContain('Prime difficult notes');
		expect(target.textContent).toContain('Difficulty > 7.5');
		expect(target.textContent).not.toContain('No difficult notes due');

		const priming = findButton('Prime difficult notes');
		expect(priming?.disabled).toBe(false);
		priming?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(onStartPriming).toHaveBeenCalledTimes(1);
	});

	it('shows the All decks threshold support line and ready priming action', async () => {
		const onStartPriming = vi.fn();
		await mountFooter({ onStartPriming });

		const priming = findButton('Prime difficult notes');
		expect(priming).not.toBeNull();
		expect(target.textContent).toContain('Difficulty > 7.0');
		expect(priming?.disabled).toBe(false);
		priming?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(onStartPriming).toHaveBeenCalledTimes(1);
	});

	it('disables priming with the empty state copy when no difficult notes are due', async () => {
		await mountFooter({
			primingAvailability: 'empty',
			reviewDueCount: 4,
		});

		const priming = findButton('Prime difficult notes');
		expect(priming).not.toBeNull();
		expect(priming?.disabled).toBe(true);
		expect(target.textContent).toContain('No difficult notes due');
	});

	it('disables priming while checking without the empty-state copy', async () => {
		await mountFooter({ primingAvailability: 'checking' });

		const priming = findButton('Prime difficult notes');
		expect(priming?.disabled).toBe(true);
		expect(target.textContent).not.toContain('No difficult notes due');
		expect(target.textContent).toContain('Difficulty > 7.0');
	});

	it('keeps priming enabled when availability is unavailable', async () => {
		await mountFooter({ primingAvailability: 'unavailable' });

		const priming = findButton('Prime difficult notes');
		expect(priming?.disabled).toBe(false);
		expect(target.textContent).toContain('Difficulty > 7.0');
	});

	it('shows Loading... and disables only review while loading', async () => {
		const onStartReview = vi.fn();
		const onStartPriming = vi.fn();
		await mountFooter({
			onStartReview,
			onStartPriming,
			isLoading: true,
			reviewDueCount: 4,
			primingAvailability: 'available',
		});

		const review = findButton('Loading...');
		expect(review).not.toBeNull();
		expect(review?.disabled).toBe(true);

		const priming = findButton('Prime difficult notes');
		expect(priming).not.toBeNull();
		expect(priming?.disabled).toBe(false);
		expect(target.textContent).not.toContain('No difficult notes due');
	});

	it('disables review at zero due cards and shows the caught-up state', async () => {
		await mountFooter({
			reviewDueCount: 0,
			stats: {
				...DEFAULT_STATISTICS,
				flashcard: { ...DEFAULT_STATISTICS.flashcard, next_review: '' },
			},
		});

		const review = findButton('All caught up!');
		expect(review).not.toBeNull();
		expect(review?.disabled).toBe(true);
	});
});
