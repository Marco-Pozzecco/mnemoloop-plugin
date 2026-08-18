import { CardStatus, CardType } from '@/schemas';

export const MANAGE_TYPE_OPTIONS = [
	{ value: CardType.Basic, label: 'Basic' },
	{ value: CardType.Sequence, label: 'Sequence' },
	{ value: CardType.Quiz, label: 'Quiz' },
	{ value: CardType.Cloze, label: 'Cloze' },
];

export const MANAGE_STATUS_OPTIONS = [
	{ value: CardStatus.ACTIVE, label: 'ACTIVE' },
	{ value: CardStatus.PAUSED, label: 'PAUSED' },
	{ value: CardStatus.STALE, label: 'STALE' },
	{ value: CardStatus.DELETED, label: 'DELETED' },
];
