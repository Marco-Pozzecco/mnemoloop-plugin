// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { CardType, type FlashcardOcclusionContent } from '@/schemas';
import OcclusionContentHarness from '../../../../../../helpers/OcclusionContentHarness.svelte';
import { createMockPlugin } from '../../../../../../helpers/mock-obsidian';

const content: FlashcardOcclusionContent = {
	meta_type: CardType.Occlusion,
	image: 'lungs.png',
	width: 1000,
	height: 800,
	masks: [
		{ id: 'm1', rect: [0.1, 0.1, 0.2, 0.2], answer: 'Left upper lobe', hint: null, opaque: true },
		{ id: 'm2', rect: [0.5, 0.5, 0.2, 0.2], answer: 'Right lower lobe', hint: 'lower', opaque: true },
	],
};

const threeMaskContent: FlashcardOcclusionContent = {
	...content,
	masks: [
		{ id: 'm1', rect: [0.1, 0.1, 0.2, 0.2], answer: 'Alpha', hint: null, opaque: true },
		{ id: 'm2', rect: [0.4, 0.4, 0.2, 0.2], answer: 'Beta', hint: null, opaque: true },
		{ id: 'm3', rect: [0.7, 0.7, 0.2, 0.2], answer: 'Gamma', hint: null, opaque: true },
	],
};

const sharedAnswerContent: FlashcardOcclusionContent = {
	...content,
	masks: [
		{ id: 'm1', rect: [0.1, 0.1, 0.2, 0.2], answer: 'Lobe', hint: null, opaque: true },
		{ id: 'm2', rect: [0.5, 0.5, 0.2, 0.2], answer: 'Lobe', hint: null, opaque: true },
	],
};

// 0.02 wide is 2px on a 100px-wide image, far below the 44px minimum hit area.
const tinyMaskContent: FlashcardOcclusionContent = {
	...content,
	masks: [{ id: 'm1', rect: [0.5, 0.5, 0.02, 0.02], answer: 'Tiny', hint: null, opaque: true }],
};

// Centres at 0.41 and 0.51; the midpoint between them is 0.46.
const overlappingContent: FlashcardOcclusionContent = {
	...content,
	masks: [
		{ id: 'left', rect: [0.4, 0.5, 0.02, 0.02], answer: 'Left', hint: null, opaque: true },
		{ id: 'right', rect: [0.5, 0.5, 0.02, 0.02], answer: 'Right', hint: null, opaque: true },
	],
};

const LINK_TARGETS = { 'lungs.png': 'attachments/lungs.png' };

describe('Occlusion review interaction', () => {
	let target: HTMLDivElement;
	let app: ReturnType<typeof createMockPlugin>;
	let unmountOcclusion: (() => Promise<void>) | undefined;
	let mountedContent: FlashcardOcclusionContent = content;

	function mountOcclusion(
		props: {
			content?: FlashcardOcclusionContent;
			isAnswerShowing?: boolean;
		} = {},
	) {
		mountedContent = props.content ?? content;
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onShowAnswer = vi.fn();
		const onSetAnswerCorrectness = vi.fn();
		const onAllRevealed = vi.fn();
		const instance = mount(OcclusionContentHarness, {
			target,
			props: {
				app: app.app as unknown as App,
				content: props.content ?? content,
				isAnswerShowing: props.isAnswerShowing ?? false,
				onShowAnswer,
				onSetAnswerCorrectness,
				onAllRevealed,
			},
		});
		unmountOcclusion = () => unmount(instance);
		return { onShowAnswer, onSetAnswerCorrectness, onAllRevealed };
	}

	function regions(): HTMLElement[] {
		return Array.from(target.querySelectorAll<HTMLElement>('.ml-occlusion-mask'));
	}

	function regionByAnswer(answer: string): HTMLElement {
		const mask = mountedContent.masks.find((candidate) => candidate.answer === answer);
		if (!mask) throw new Error(`No mask with answer ${answer}`);
		const region = regions().find((element) => element.getAttribute('data-mask-id') === mask.id);
		if (!region) throw new Error(`No region for mask ${mask.id}`);
		return region;
	}

	function promptAnswer(): string {
		return (
			target.querySelector('.ml-occlusion-header__question b')?.textContent?.trim() ?? ''
		);
	}

	function regionAnswers(): string[] {
		return regions().map((region) => {
			const id = region.getAttribute('data-mask-id');
			return mountedContent.masks.find((mask) => mask.id === id)?.answer ?? '';
		});
	}

	function otherAnswer(than: string): string {
		return regionAnswers().find((answer) => answer !== than) ?? '';
	}

	function clickRegion(answer: string): void {
		regionByAnswer(answer).click();
	}

	function stubImageRect(width: number, height: number): HTMLElement {
		const image = target.querySelector<HTMLElement>('.ml-occlusion-stage__inner');
		if (!image) throw new Error('Image container not found');
		Object.defineProperty(image, 'getBoundingClientRect', {
			configurable: true,
			value: () => ({
				x: 0,
				y: 0,
				left: 0,
				top: 0,
				right: width,
				bottom: height,
				width,
				height,
				toJSON: () => ({}),
			}),
		});
		return image;
	}

	afterEach(async () => {
		await unmountOcclusion?.();
		unmountOcclusion = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('shows the image with one region per mask and prompts with a mask answer', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion();
		await tick();

		expect(target.querySelector('img')?.getAttribute('src')).toBe('app://local/attachments/lungs.png');
		expect(regions()).toHaveLength(2);
		expect(regionAnswers().sort()).toEqual(['Left upper lobe', 'Right lower lobe']);
		expect(['Left upper lobe', 'Right lower lobe']).toContain(promptAnswer());
	});

	it('reveals the selected region, keeps it revealed, and advances the prompt', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion();
		await tick();

		const first = promptAnswer();
		const second = otherAnswer(first);
		const selected = regionByAnswer(first);

		selected.click();
		await tick();

		expect(selected.getAttribute('aria-pressed')).toBe('true');
		expect(promptAnswer()).toBe(second);
		expect(regionByAnswer(first).getAttribute('aria-pressed')).toBe('true');
	});

	it('counts a selection with a different answer as incorrect and reveals both regions', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion();
		await tick();

		const prompted = promptAnswer();
		const other = otherAnswer(prompted);

		clickRegion(other);
		await tick();

		expect(regionByAnswer(prompted).getAttribute('aria-pressed')).toBe('true');
		expect(regionByAnswer(other).getAttribute('aria-pressed')).toBe('true');
		expect(regionByAnswer(prompted).classList.contains('ml-occlusion-mask--missed')).toBe(true);
	});

	it('accepts either region when two masks share an answer', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		const { onShowAnswer, onSetAnswerCorrectness } = mountOcclusion({
			content: sharedAnswerContent,
		});
		await tick();

		expect(promptAnswer()).toBe('Lobe');
		regions()[0].click();
		await tick();

		expect(promptAnswer()).toBe('Lobe');
		regions()[1].click();
		await tick();

		expect(onSetAnswerCorrectness).toHaveBeenLastCalledWith(true);
		expect(onShowAnswer).toHaveBeenCalledOnce();
	});

	it('reports the card correct only when every prompt was answered correctly', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		const { onShowAnswer, onSetAnswerCorrectness, onAllRevealed } = mountOcclusion();
		await tick();

		clickRegion(promptAnswer());
		await tick();

		// Prompts remain, so the outcome controls must not be offered yet.
		expect(onShowAnswer).not.toHaveBeenCalled();
		expect(onAllRevealed).not.toHaveBeenCalled();

		clickRegion(promptAnswer());
		await tick();

		expect(onSetAnswerCorrectness).toHaveBeenLastCalledWith(true);
		expect(onAllRevealed).toHaveBeenCalledOnce();
		expect(onShowAnswer).toHaveBeenCalledOnce();
		expect(target.querySelector('.ml-occlusion-reveal')).toBeNull();
		expect(regions().every((region) => region.getAttribute('aria-pressed') === 'true')).toBe(true);
	});

	it('reports the card incorrect when a selection missed', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		const { onSetAnswerCorrectness } = mountOcclusion();
		await tick();

		const prompted = promptAnswer();
		clickRegion(otherAnswer(prompted));
		await tick();

		clickRegion(promptAnswer());
		await tick();

		expect(onSetAnswerCorrectness).toHaveBeenLastCalledWith(false);
	});

	it('walks one prompt per mask before presenting the outcome', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		const { onAllRevealed } = mountOcclusion({ content: threeMaskContent });
		await tick();

		const seen: string[] = [];
		for (let index = 0; index < 3; index += 1) {
			const answer = promptAnswer();
			seen.push(answer);
			clickRegion(answer);
			await tick();
		}

		expect(new Set(seen).size).toBe(3);
		expect(onAllRevealed).toHaveBeenCalledOnce();
		expect(promptAnswer()).toBe('');
	});

	it('revealing all mid-card presents the outcome and counts unanswered prompts incorrect', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		const { onShowAnswer, onSetAnswerCorrectness, onAllRevealed } = mountOcclusion({
			content: threeMaskContent,
		});
		await tick();

		clickRegion(promptAnswer());
		await tick();
		expect(onShowAnswer).not.toHaveBeenCalled();

		const revealAllButton = target.querySelector<HTMLButtonElement>('.ml-occlusion-reveal');
		if (!revealAllButton) throw new Error('Reveal all control not found');
		revealAllButton.click();
		await tick();

		expect(regions().every((region) => region.getAttribute('aria-pressed') === 'true')).toBe(true);
		expect(onSetAnswerCorrectness).toHaveBeenLastCalledWith(false);
		expect(onAllRevealed).toHaveBeenCalledOnce();
		expect(onShowAnswer).toHaveBeenCalledOnce();
		expect(target.querySelector('.ml-occlusion-reveal')).toBeNull();
	});

	it('reports an unresolved image by name and still scores the card', async () => {
		app = createMockPlugin([]);

		const { onSetAnswerCorrectness } = mountOcclusion();
		await tick();

		expect(target.querySelector('img')).toBeNull();
		expect(target.querySelector('.ml-occlusion-missing')?.textContent).toContain('lungs.png');

		clickRegion(promptAnswer());
		await tick();
		clickRegion(promptAnswer());
		await tick();

		expect(onSetAnswerCorrectness).toHaveBeenLastCalledWith(true);
	});

	it('selects a region with Enter and Space like a pointer click', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion({ content: threeMaskContent });
		await tick();

		const first = regionByAnswer(promptAnswer());
		first.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
		);
		await tick();

		expect(first.getAttribute('aria-pressed')).toBe('true');

		const second = regionByAnswer(promptAnswer());
		second.dispatchEvent(
			new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }),
		);
		await tick();

		expect(second.getAttribute('aria-pressed')).toBe('true');
	});

	it('exposes the prompt and a positional name for every region without the answer', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion();
		await tick();

		const answer = promptAnswer();
		expect(answer).not.toBe('');
		expect(target.querySelector('.ml-occlusion-header')?.textContent).toContain(answer);

		for (const [index, region] of regions().entries()) {
			// An aria-label would become a hover tooltip in Obsidian.
			expect(region.getAttribute('aria-label')).toBeNull();
			expect(region.querySelector('.ml-occlusion-mask__name')?.textContent?.trim()).toBe(
				`Region ${index + 1}`,
			);
		}
	});

	it('selects a region smaller than the minimum hit area from a near miss', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion({ content: tinyMaskContent });
		await tick();

		stubImageRect(100, 100);
		const region = regionByAnswer('Tiny');
		region.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 60, clientY: 51 }));
		await tick();

		expect(region.getAttribute('aria-pressed')).toBe('true');
	});

	it('resolves an overlapping click to the region whose centre is nearest', async () => {
		app = createMockPlugin([], { linkTargets: LINK_TARGETS });

		mountOcclusion({ content: overlappingContent });
		await tick();

		stubImageRect(100, 100);
		const prompted = promptAnswer();
		const other = otherAnswer(prompted);
		// Click just on the far side of the 0.46 midpoint, so the nearest centre
		// belongs to the region that was not prompted.
		const clientX = other === 'Right' ? 47 : 45;

		regionByAnswer(prompted).dispatchEvent(
			new MouseEvent('click', { bubbles: true, clientX, clientY: 51 }),
		);
		await tick();

		expect(regionByAnswer(other).getAttribute('aria-pressed')).toBe('true');
		expect(regionByAnswer(prompted).classList.contains('ml-occlusion-mask--missed')).toBe(true);
	});
});
