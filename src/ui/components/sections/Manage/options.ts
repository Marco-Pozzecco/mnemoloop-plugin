import { CardStatus, CardType } from '@/schemas';
import type { BadgeProps } from '@/ui/components/elements';
import { capitalize } from '@/utils/String';

export const MANAGE_TYPE_OPTIONS = [
	{ value: CardType.Basic, label: 'Basic' },
	{ value: CardType.Sequence, label: 'Sequence' },
	{ value: CardType.Quiz, label: 'Quiz' },
	{ value: CardType.Cloze, label: 'Cloze' },
	{ value: CardType.Occlusion, label: 'Occlusion' },
];

/**
 * The stored type is lower-case (`basic`); the badge reads it as a label
 * (`Basic`). An unrecognised value still reads as a word.
 */
export function cardTypeLabel(type: CardType | undefined): string {
	if (!type) return '';
	return MANAGE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? capitalize(type);
}

export const MANAGE_STATUS_OPTIONS = [
	{ value: CardStatus.ACTIVE, label: 'ACTIVE' },
	{ value: CardStatus.PAUSED, label: 'PAUSED' },
	{ value: CardStatus.STALE, label: 'STALE' },
	{ value: CardStatus.DELETED, label: 'DELETED' },
];

/** Status reads from a semantic badge tone, not from its shape. */
export const MANAGE_STATUS_VARIANT: Record<CardStatus, NonNullable<BadgeProps['variant']>> = {
	[CardStatus.ACTIVE]: 'success',
	[CardStatus.PAUSED]: 'neutral',
	[CardStatus.STALE]: 'warning',
	[CardStatus.DELETED]: 'error',
};
