// @vitest-environment jsdom
import '../../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { CardType, type FlashcardOcclusionContent } from '@/schemas';
import OcclusionContentHarness from '../../../../../../../helpers/OcclusionContentHarness.svelte';
import { createMockPlugin } from '../../../../../../../helpers/mock-obsidian';

const CONTENT: FlashcardOcclusionContent = {
	meta_type: CardType.Occlusion,
	image: 'lungs.png',
	width: 1000,
	height: 800,
	masks: [
		{
			id: 'm1',
			rect: [0.1, 0.1, 0.2, 0.2],
			answer: 'Heart',
			hint: 'Between the lungs',
			opaque: true,
		},
		{ id: 'm2', rect: [0.5, 0.5, 0.2, 0.2], answer: 'Left lung', hint: null, opaque: false },
		{ id: 'm3', rect: [0.7, 0.7, 0.2, 0.2], answer: 'Trachea', hint: null, opaque: true },
	],
};

const HINTED: FlashcardOcclusionContent = {
	...CONTENT,
	masks: [
		{
			id: 'm1',
			rect: [0.1, 0.1, 0.2, 0.2],
			answer: 'Heart',
			hint: 'Between the lungs',
			opaque: true,
		},
	],
};

const UNHINTED: FlashcardOcclusionContent = {
	...CONTENT,
	masks: CONTENT.masks.map((mask) => ({ ...mask, hint: null })),
};

const LINK_TARGETS = { 'lungs.png': 'attachments/lungs.png' };

describe('Occlusion review affordances', () => {
	let target: HTMLDivElement;
	let unmountOcclusion: (() => Promise<void>) | undefined;
	let onShowAnswer: ReturnType<typeof vi.fn>;
	let mountedContent: FlashcardOcclusionContent = CONTENT;

	async function mountOcclusion(content: FlashcardOcclusionContent = CONTENT) {
		mountedContent = content;
		const app = createMockPlugin([], { linkTargets: LINK_TARGETS });
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		onShowAnswer = vi.fn();
		const instance = mount(OcclusionContentHarness, {
			target,
			props: {
				app: app.app as unknown as App,
				content,
				onShowAnswer,
				onSetAnswerCorrectness: vi.fn(),
				onAllRevealed: vi.fn(),
			},
		});
		unmountOcclusion = () => unmount(instance);
		await tick();
	}

	function promptAnswer(): string {
		return (
			target.querySelector('.ml-occlusion-header__question b')?.textContent?.trim() ?? ''
		);
	}

	function regionFor(answer: string): HTMLElement {
		const mask = mountedContent.masks.find((candidate) => candidate.answer === answer);
		if (!mask) throw new Error(`No region with answer ${answer}`);
		const region = target.querySelector<HTMLElement>(
			`.ml-occlusion-mask[data-mask-id="${mask.id}"]`,
		);
		if (!region) throw new Error(`No region for mask ${mask.id}`);
		return region;
	}

	function clickRegion(answer: string): void {
		regionFor(answer).click();
	}

	function segments(): string[] {
		return Array.from(target.querySelectorAll('.ml-occlusion-segment')).map(
			(element) =>
				Array.from(element.classList).find((name) => name.startsWith('ml-occlusion-segment--')) ??
				'',
		);
	}

	afterEach(async () => {
		await unmountOcclusion?.();
		unmountOcclusion = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('shows one progress segment per prompt and fills them as they resolve', async () => {
		await mountOcclusion();

		expect(segments()).toEqual([
			'ml-occlusion-segment--current',
			'ml-occlusion-segment--pending',
			'ml-occlusion-segment--pending',
		]);

		clickRegion(promptAnswer());
		await tick();

		expect(segments()).toEqual([
			'ml-occlusion-segment--correct',
			'ml-occlusion-segment--current',
			'ml-occlusion-segment--pending',
		]);
	});

	it('does not expose the answer on a hidden region', async () => {
		await mountOcclusion();

		const regions = Array.from(target.querySelectorAll<HTMLButtonElement>('.ml-occlusion-mask'));
		expect(regions).toHaveLength(3);

		for (const [index, region] of regions.entries()) {
			// An aria-label would surface as a hover tooltip in Obsidian.
			expect(region.getAttribute('aria-label')).toBeNull();
			expect(region.getAttribute('data-mask-id')).toBeTruthy();
			expect(region.querySelector('.ml-occlusion-mask__name')?.textContent?.trim()).toBe(
				`Region ${index + 1}`,
			);
			expect(region.querySelector('.ml-occlusion-mask__answer')).toBeNull();
		}
	});

	it('labels transparent regions on reveal but not opaque ones', async () => {
		await mountOcclusion();

		target.querySelector<HTMLButtonElement>('.ml-occlusion-reveal')?.click();
		await tick();

		expect(regionFor('Left lung').querySelector('.ml-occlusion-mask__answer')?.textContent).toBe(
			'Left lung',
		);
		expect(regionFor('Heart').querySelector('.ml-occlusion-mask__answer')).toBeNull();
		expect(regionFor('Trachea').querySelector('.ml-occlusion-mask__answer')).toBeNull();

		expect(regionFor('Left lung').classList.contains('ml-occlusion-mask--transparent')).toBe(true);
		expect(regionFor('Heart').classList.contains('ml-occlusion-mask--transparent')).toBe(false);
	});

	it('shows the stored hint, hides it again, and drops it when the card completes', async () => {
		await mountOcclusion(HINTED);

		const hintButton = target.querySelector<HTMLButtonElement>('.ml-occlusion-hint__button');
		if (!hintButton) throw new Error('Hint button not found');
		expect(hintButton.getAttribute('aria-expanded')).toBe('false');

		hintButton.click();
		await tick();

		expect(target.querySelector('[role="region"][aria-label="Hint"]')).not.toBeNull();
		expect(hintButton.getAttribute('aria-expanded')).toBe('true');

		clickRegion(promptAnswer());
		await tick();

		expect(target.querySelector('.ml-occlusion-hint__button')).toBeNull();
		expect(target.querySelector('.ml-occlusion-hint')).toBeNull();
	});

	it('offers no hint control when the prompted mask has no hint', async () => {
		await mountOcclusion(UNHINTED);

		expect(target.querySelector('.ml-occlusion-hint__button')).toBeNull();
	});

	it('recaps every prompt with its answer and marks the misses', async () => {
		await mountOcclusion();

		const prompted = promptAnswer();
		const wrong = CONTENT.masks.find((mask) => mask.answer !== prompted)?.answer ?? '';
		clickRegion(wrong);
		await tick();

		const feedback = target.querySelector('.ml-occlusion-feedback');
		expect(feedback?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			`Not quite. You selected ${wrong}. The ${prompted} region is highlighted.`,
		);

		for (let index = 1; index < CONTENT.masks.length; index += 1) {
			clickRegion(promptAnswer());
			await tick();
		}

		expect(
			target.querySelector('.ml-occlusion-recap__score')?.textContent?.replace(/\s+/g, ' ').trim(),
		).toBe('2 of 3 correct');
		expect(target.querySelector('.ml-occlusion-recap__missing')?.textContent).toContain('1 missed');
		expect(
			Array.from(target.querySelectorAll('.ml-occlusion-recap__item--missed')).map((element) =>
				element.textContent?.replace(/\s+/g, ' ').trim(),
			),
		).toEqual([`✕ ${prompted}`]);
		expect(onShowAnswer).toHaveBeenCalledOnce();
	});

	it('opens the expanded viewer with the hidden regions intact and closes on Escape', async () => {
		await mountOcclusion();

		target.querySelector<HTMLButtonElement>('.ml-occlusion-expand')?.click();
		await tick();

		const dialog = target.querySelector('[role="dialog"]');
		expect(dialog).not.toBeNull();
		expect(dialog?.querySelectorAll('.ml-occlusion-mask--static')).toHaveLength(3);
		expect(dialog?.querySelectorAll('.ml-occlusion-mask--hidden')).toHaveLength(3);

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await tick();

		expect(target.querySelector('[role="dialog"]')).toBeNull();
	});
});
