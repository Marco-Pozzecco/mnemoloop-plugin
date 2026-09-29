import { describe, expect, it } from 'vitest';
import { CardType } from '@/schemas';
import {
	buildOcclusionContent,
	rectFromPoints,
	translateRect,
	validateOcclusion,
	type EditableOcclusionMask,
} from '@/ui/components/modals/FlashcardFormModal/Content/Occlusion/validation';

function mask(overrides: Partial<EditableOcclusionMask> = {}): EditableOcclusionMask {
	return {
		id: 'm1',
		rect: [0.1, 0.1, 0.2, 0.2],
		answer: 'Left upper lobe',
		hint: '',
		...overrides,
	};
}

describe('validateOcclusion', () => {
	it('should return an error when no image is chosen', () => {
		expect(validateOcclusion('', [mask()])).toBe('An image is required.');
	});

	it('should return an error when there are no masks', () => {
		expect(validateOcclusion('lungs.png', [])).toBe('At least one mask is required.');
	});

	it('should return an error naming the first mask without an answer', () => {
		expect(
			validateOcclusion('lungs.png', [
				mask({ id: 'm1', answer: 'A' }),
				mask({ id: 'm2', answer: '  ' }),
				mask({ id: 'm3', answer: '' }),
			]),
		).toBe('Mask 2 must have an answer.');
	});

	it('should return null for a valid card', () => {
		expect(validateOcclusion('lungs.png', [mask(), mask({ id: 'm2', answer: 'B' })])).toBeNull();
	});
});

describe('buildOcclusionContent', () => {
	it('should assign positional ids and trim fields', () => {
		const result = buildOcclusionContent(
			'lungs.png',
			{ width: 1024, height: 768 },
			[
				mask({ id: 'stale-a', answer: '  Left upper lobe  ', hint: '  upper  ' }),
				mask({ id: 'stale-b', answer: 'B', hint: '' }),
			],
		);

		expect(result).toEqual({
			meta_type: CardType.Occlusion,
			image: 'lungs.png',
			width: 1024,
			height: 768,
			masks: [
				{ id: 'm1', rect: [0.1, 0.1, 0.2, 0.2], answer: 'Left upper lobe', hint: 'upper' },
				{ id: 'm2', rect: [0.1, 0.1, 0.2, 0.2], answer: 'B', hint: null },
			],
		});
	});

	it('should leave absent dimensions absent', () => {
		const result = buildOcclusionContent('lungs.png', {}, [mask()]);

		expect(result).not.toHaveProperty('width');
		expect(result).not.toHaveProperty('height');
	});
});

describe('rectFromPoints', () => {
	it('should build a rect from a top-left to bottom-right drag', () => {
		expect(rectFromPoints({ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.6 })).toEqual([0.1, 0.2, 0.3, 0.4]);
	});

	it('should build a positive-size rect from a reversed drag', () => {
		expect(rectFromPoints({ x: 0.4, y: 0.6 }, { x: 0.1, y: 0.2 })).toEqual([0.1, 0.2, 0.3, 0.4]);
	});

	it('should clamp to the image bounds', () => {
		expect(rectFromPoints({ x: -0.2, y: -0.1 }, { x: 1.3, y: 1.4 })).toEqual([0, 0, 1, 1]);
	});
});

describe('translateRect', () => {
	it('should move a rect by the delta', () => {
		expect(translateRect([0.1, 0.1, 0.2, 0.2], 0.3, 0.4)).toEqual([0.4, 0.5, 0.2, 0.2]);
	});

	it('should keep a rect inside the image bounds', () => {
		expect(translateRect([0.1, 0.1, 0.2, 0.2], -0.5, -0.5)).toEqual([0, 0, 0.2, 0.2]);
		expect(translateRect([0.1, 0.1, 0.2, 0.2], 0.9, 0.9)).toEqual([0.8, 0.8, 0.2, 0.2]);
	});
});
