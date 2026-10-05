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
		{ id: 'm1', rect: [0.1, 0.1, 0.2, 0.2], answer: 'Heart', hint: 'Between the lungs' },
		{ id: 'm2', rect: [0.5, 0.5, 0.2, 0.2], answer: 'Left lung', hint: null },
		{ id: 'm3', rect: [0.7, 0.7, 0.2, 0.2], answer: 'Trachea', hint: null },
	],
};

const LINK_TARGETS = { 'lungs.png': 'attachments/lungs.png' };

describe('Occlusion review affordances', () => {
	let target: HTMLDivElement;
	let unmountOcclusion: (() => Promise<void>) | undefined;
	let onShowAnswer: ReturnType<typeof vi.fn>;

	async function mountOcclusion(content: FlashcardOcclusionContent = CONTENT) {
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

	function clickRegion(label: string): void {
		const region = Array.from(target.querySelectorAll<HTMLElement>('.ml-occlusion-mask')).find(
			(element) => element.getAttribute('aria-label') === label,
		);
		if (!region) throw new Error(`No region labelled ${label}`);
		region.click();
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
});
