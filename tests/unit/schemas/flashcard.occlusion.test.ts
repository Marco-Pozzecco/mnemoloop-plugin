import { describe, expect, it } from 'vitest';
import {
	CardType,
	Flashcard,
	FlashcardOcclusionContentSchema,
	FlashcardOcclusionSchema,
	isFlashcardBase,
	isFlashcardCloze,
	isFlashcardOcclusion,
	isFlashcardQuiz,
	isFlashcardSequence,
} from '@/schemas';
import { createFlashcardYaml } from '../../helpers/factories';

const validMask = {
	id: 'm1',
	rect: [0.12, 0.3, 0.2, 0.1],
	answer: 'Left upper lobe',
	hint: null,
	opaque: true,
};

const validContent = {
	meta_type: 'occlusion',
	image: 'lungs.png',
	width: 1024,
	height: 768,
	masks: [validMask],
};

describe('FlashcardOcclusionContentSchema', () => {
	it('should accept valid occlusion content', () => {
		const result = FlashcardOcclusionContentSchema.parse(validContent);

		expect(result.meta_type).toBe('occlusion');
		expect(result.image).toBe('lungs.png');
		expect(result.width).toBe(1024);
		expect(result.height).toBe(768);
		expect(result.masks).toHaveLength(1);
		expect(result.masks[0]).toEqual(validMask);
	});

	it('should accept content omitting dimensions', () => {
		const { width: _width, height: _height, ...withoutDimensions } = validContent;

		const result = FlashcardOcclusionContentSchema.parse(withoutDimensions);

		expect(result.width).toBeUndefined();
		expect(result.height).toBeUndefined();
		expect(result.masks).toHaveLength(1);
	});

	it('should accept a mask with a hint', () => {
		const result = FlashcardOcclusionContentSchema.parse({
			...validContent,
			masks: [{ ...validMask, hint: 'upper division' }],
		});

		expect(result.masks[0].hint).toBe('upper division');
	});

	it('should default an omitted opacity mode to opaque', () => {
		const { opaque: _opaque, ...maskWithoutMode } = validMask;

		const result = FlashcardOcclusionContentSchema.parse({
			...validContent,
			masks: [maskWithoutMode],
		});

		expect(result.masks[0].opaque).toBe(true);
	});

	it('should accept a transparent mask', () => {
		const result = FlashcardOcclusionContentSchema.parse({
			...validContent,
			masks: [{ ...validMask, opaque: false }],
		});

		expect(result.masks[0].opaque).toBe(false);
	});

	it('should reject a non-boolean opacity mode', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({
				...validContent,
				masks: [{ ...validMask, opaque: 'yes' }],
			}),
		).toThrow();
	});

	it('should reject an empty masks array', () => {
		expect(() => FlashcardOcclusionContentSchema.parse({ ...validContent, masks: [] })).toThrow();
	});

	it('should reject a mask with an empty answer', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({
				...validContent,
				masks: [{ ...validMask, answer: '' }],
			}),
		).toThrow();
	});

	it('should reject a rect value above 1', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({
				...validContent,
				masks: [{ ...validMask, rect: [0.1, 0.2, 0.3, 1.5] }],
			}),
		).toThrow();
	});

	it('should reject a rect value below 0', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({
				...validContent,
				masks: [{ ...validMask, rect: [-0.1, 0.2, 0.3, 0.4] }],
			}),
		).toThrow();
	});

	it('should reject a rect with three values', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({
				...validContent,
				masks: [{ ...validMask, rect: [0.1, 0.2, 0.3] }],
			}),
		).toThrow();
	});

	it('should reject non-positive dimensions', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({ ...validContent, width: 0 }),
		).toThrow();
		expect(() =>
			FlashcardOcclusionContentSchema.parse({ ...validContent, height: 768.5 }),
		).toThrow();
		expect(() =>
			FlashcardOcclusionContentSchema.parse({ ...validContent, width: -100 }),
		).toThrow();
	});

	it('should reject a wrong meta_type', () => {
		expect(() =>
			FlashcardOcclusionContentSchema.parse({ ...validContent, meta_type: 'cloze' }),
		).toThrow();
	});
});

describe('FlashcardOcclusionSchema', () => {
	it('should accept a full occlusion card', () => {
		const card = {
			...createFlashcardYaml({ card_type: CardType.Occlusion }),
			content: validContent,
		};

		const result = FlashcardOcclusionSchema.parse(card);

		expect(result.card_type).toBe('occlusion');
		expect(result.content.image).toBe('lungs.png');
	});
});

describe('isFlashcardOcclusion', () => {
	const contentByType: Record<string, unknown> = {
		[CardType.Basic]: { meta_type: CardType.Basic, front: 'q', back: 'a' },
		[CardType.Sequence]: { meta_type: CardType.Sequence, steps: ['one', 'two'] },
		[CardType.Quiz]: {
			meta_type: CardType.Quiz,
			question: 'q',
			options: ['a', 'b'],
			correct_index: 0,
		},
		[CardType.Cloze]: {
			meta_type: CardType.Cloze,
			text: 'x',
			deletions: [{ id: 'c1', answer: 'a', hint: null, positions: [0] }],
		},
		[CardType.Occlusion]: validContent,
	};

	const cardOfType = (cardType: CardType, content: unknown): Flashcard =>
		({
			...createFlashcardYaml({ card_type: cardType }),
			content,
		}) as unknown as Flashcard;

	it('should identify an occlusion card', () => {
		const card = cardOfType(CardType.Occlusion, contentByType[CardType.Occlusion]);

		expect(isFlashcardOcclusion(card)).toBe(true);
	});

	it('should not identify any of the other four types as occlusion', () => {
		for (const cardType of [
			CardType.Basic,
			CardType.Sequence,
			CardType.Quiz,
			CardType.Cloze,
		]) {
			expect(isFlashcardOcclusion(cardOfType(cardType, contentByType[cardType]))).toBe(false);
		}
	});

	it('should not identify an occlusion card through the other guards', () => {
		const card = cardOfType(CardType.Occlusion, contentByType[CardType.Occlusion]);

		expect(isFlashcardBase(card)).toBe(false);
		expect(isFlashcardSequence(card)).toBe(false);
		expect(isFlashcardQuiz(card)).toBe(false);
		expect(isFlashcardCloze(card)).toBe(false);
	});
});
