import type { Stats } from '@/schemas';
import { DeckData } from '@/ui/store/deck-tree.store';

export default interface DashboardFooterProps {
	stats: Stats;
	onStartReview: () => void;
	onStartPriming: () => void;
	isDisabled?: boolean;
	isPrimingDisabled?: boolean;
	difficultyThreshold?: number;
	isLoading?: boolean;
	selectedDeck?: DeckData | null;
	className?: string;
}
