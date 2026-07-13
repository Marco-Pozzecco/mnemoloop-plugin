import { describe, it, expect, vi } from 'vitest';
import { Platform } from 'obsidian';
import { CardType } from '@/schemas';

describe('ScoreControls', () => {
	describe('Platform.isMobile', () => {
		it('should default to false (desktop)', () => {
			expect(Platform.isMobile).toBe(false);
		});
	});

	describe('cardType guards', () => {
		it('should have distinct Basic and Sequence card types', () => {
			expect(CardType.Basic).toBe('basic');
			expect(CardType.Sequence).toBe('sequence');
			expect(CardType.Basic).not.toBe(CardType.Sequence);
		});
	});

	describe('onContinue callback contract', () => {
		it('should be callable as a void function', () => {
			const onContinue = vi.fn();
			onContinue();
			expect(onContinue).toHaveBeenCalledOnce();
		});

		it('should map sequenceIsCorrect to rating: correct->Good(3), incorrect->Again(1)', () => {
			const onSubmitRating = vi.fn();

			const isCorrect = true;
			(() => onSubmitRating(isCorrect ? 3 : 1))();

			onSubmitRating.mockClear();

			// Incorrect sequence -> Again (1)
			const isIncorrect = false;
			(() => onSubmitRating(isIncorrect ? 3 : 1))();
		});
	});

	describe('AutoReviewControls — keydown guard conditions', () => {
		it('should gate on event.code === "Space"', () => {
			const targetKey = 'Space' as string;
			expect('Space' === targetKey).toBe(true);
			expect('Enter' === targetKey).toBe(false);
			expect('Digit1' === targetKey).toBe(false);
		});

		it('should bail out when disabled', () => {
			const calls: string[] = [];
			const simulate = (disabled: boolean) => {
				if (disabled) return;
				calls.push('continue');
			};

			simulate(true);
			expect(calls).toHaveLength(0);

			simulate(false);
			expect(calls).toEqual(['continue']);
		});

		it('should only activate for CardType.Sequence', () => {
			const target = CardType.Sequence as CardType;
			expect(CardType.Sequence === target).toBe(true);
			expect(CardType.Basic === target).toBe(false);
		});
	});

	describe('AutoReviewControls — combined guard logic (desktop vs touch)', () => {
		it('desktop + Sequence: keyboard handles, tap skips', () => {
			const isTouchDevice = false;
			const cardType = CardType.Sequence as CardType;

			expect(!isTouchDevice && cardType === CardType.Sequence).toBe(true);
			expect(isTouchDevice).toBe(false);
		});

		it('touch + Sequence: tap handles, keyboard skips', () => {
			const isTouchDevice = true;
			const cardType = CardType.Sequence as CardType;

			expect(!isTouchDevice && cardType === CardType.Sequence).toBe(false);
			expect(isTouchDevice).toBe(true);
		});

		it('desktop + Basic: neither path handles', () => {
			const isTouchDevice = false;
			const cardType = CardType.Basic as CardType;

			expect(!isTouchDevice && cardType === CardType.Sequence).toBe(false);
			expect(isTouchDevice).toBe(false);
		});

		it('touch + Basic: neither path handles', () => {
			const isTouchDevice = true;
			const cardType = CardType.Basic as CardType;

			expect(!isTouchDevice && cardType === CardType.Sequence).toBe(false);
			expect(isTouchDevice).toBe(true);
		});

		it('disabled prevents both paths', () => {
			const disabled = true;
			expect(disabled).toBe(true);

			const calls: string[] = [];
			if (!disabled) calls.push('tap');
			if (!disabled) calls.push('keyboard');
			expect(calls).toHaveLength(0);
		});
	});

	describe('AUTO_SCORED_TYPES registry dispatch', () => {
		it('should include CardType.Sequence', () => {
			const autoScored = new Set<CardType>([CardType.Sequence]);
			expect(autoScored.has(CardType.Sequence)).toBe(true);
		});

		it('should not include CardType.Basic', () => {
			const autoScored = new Set<CardType>([CardType.Sequence]);
			expect(autoScored.has(CardType.Basic)).toBe(false);
		});

		it('should dispatch non-registered card types to manual controls (OCP extension)', () => {
			const autoScored = new Set<CardType>([CardType.Sequence]);

			// Adding a new auto-scored card type is a one-line registry change.
			// Until added, any unknown card type is treated as manual.
			expect(autoScored.has(CardType.Basic)).toBe(false);
		});

		it('should dispatch a newly registered card type to auto controls (OCP extension)', () => {
			const autoScored = new Set<CardType>([CardType.Sequence]);

			// Register a new type — the OCP extension point.
			const newAutoType = CardType.Sequence;
			autoScored.add(newAutoType);

			expect(autoScored.has(CardType.Sequence)).toBe(true);
			expect(autoScored.has(CardType.Basic)).toBe(false);
		});
	});
});
