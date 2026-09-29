import { describe, expect, it } from 'vitest';
import type { FlashcardOcclusionMask } from '@/schemas';
import { hitTestMasks } from '@/ui/components/sections/Review/Flashcard/Content/Occlusion/utils';

function mask(id: string, rect: [number, number, number, number]): FlashcardOcclusionMask {
	return { id, rect, answer: id.toUpperCase(), hint: null };
}

// A 100x100 image with 44px minimum hit targets means 0.44 in normalized units.
const MIN_SIZE = { width: 0.44, height: 0.44 };

describe('hitTestMasks', () => {
	it('selects a mask when the point is inside its rect', () => {
		const masks = [mask('a', [0.1, 0.1, 0.2, 0.2]), mask('b', [0.6, 0.6, 0.2, 0.2])];

		const hit = hitTestMasks(masks, { x: 0.65, y: 0.65 }, MIN_SIZE);

		expect(hit?.id).toBe('b');
	});

	it('selects a region smaller than the minimum hit area from just outside its rect', () => {
		// 0.02 wide is 2px on a 100px image; its inflated area is 44px centred on it.
		const masks = [mask('tiny', [0.5, 0.5, 0.02, 0.02])];

		const hit = hitTestMasks(masks, { x: 0.6, y: 0.51 }, MIN_SIZE);

		expect(hit?.id).toBe('tiny');
	});

	it('resolves overlapping inflated areas to the mask whose centre is nearest', () => {
		// Two small masks whose centres are 0.41 and 0.51; the midpoint is 0.46.
		const masks = [mask('left', [0.4, 0.5, 0.02, 0.02]), mask('right', [0.5, 0.5, 0.02, 0.02])];

		expect(hitTestMasks(masks, { x: 0.45, y: 0.51 }, MIN_SIZE)?.id).toBe('left');
		expect(hitTestMasks(masks, { x: 0.47, y: 0.51 }, MIN_SIZE)?.id).toBe('right');
	});

	it('returns null when the point is outside every inflated area', () => {
		const masks = [mask('a', [0.1, 0.1, 0.1, 0.1])];

		expect(hitTestMasks(masks, { x: 0.9, y: 0.9 }, MIN_SIZE)).toBeNull();
	});
});
