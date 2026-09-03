import type { Stats } from '@/schemas';
import { DeckData } from '@/ui/store/deck-tree.store';

export type PrimingAvailability = 'checking' | 'available' | 'empty' | 'unavailable';

export default interface DashboardFooterProps {
	stats: Stats;
	onStartReview: () => void;
	onStartPriming: () => void;
	reviewDueCount: number;
	primingAvailability: PrimingAvailability;
	difficultyThreshold?: number;
	isLoading?: boolean;
	selectedDeck?: DeckData | null;
	className?: string;
}
