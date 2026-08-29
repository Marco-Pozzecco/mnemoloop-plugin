import type { PrimingState } from '@/ui/store/priming.store';

export default interface PrimingViewProps {
	state: PrimingState;
	onExit: () => void;
	onSelect: (index: number) => void;
	onPrevious: () => void;
	onNextOrBeginReview: () => void;
	onRetry: () => void;
	onBeginReview: () => void;
}
