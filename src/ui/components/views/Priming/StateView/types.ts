import { PrimingState } from '@/ui/store/priming.store';

export default interface Props {
	state: PrimingState;
	onBeginReview: () => void;
	onRetry: () => void;
	onDashboard: () => void;
}
